import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const VALID_SLUG = "cold-brew-coffee";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/complete", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function validModelOutput() {
  return {
    has_pii_risk: false,
    redaction_notes: null,
    signals: [
      {
        topic_key: "tempo-infusione-frigo",
        gap_type: "missing_info",
        answer_source: "insufficient",
        topic_summary: "L'utente chiede quanto puo durare il concentrato in frigo oltre i tempi indicati.",
        confidence: 0.7,
        recipe_scope: "current_recipe",
        origin: {
          source: "user",
          model: null,
        },
      },
    ],
  };
}

function gatewayResponse(modelOutput: unknown) {
  return new Response(
    JSON.stringify({ provider: "test", model: "auto:balanced", text: JSON.stringify(modelOutput) }),
    { status: 200 },
  );
}

/** Mock fetch che smista le chiamate in base all'URL: AI Gateway vs GitHub Contents API. */
function makeRoutedFetchMock({
  modelOutput,
  githubStatus = 201,
}: {
  modelOutput: unknown;
  githubStatus?: number;
}) {
  return vi.fn().mockImplementation(async (url: string) => {
    if (url.startsWith("https://gateway.example")) {
      return gatewayResponse(modelOutput);
    }
    if (url.startsWith("https://api.github.com/")) {
      return new Response(JSON.stringify({ content: {} }), { status: githubStatus });
    }
    throw new Error(`URL non mockato: ${url}`);
  });
}

describe("POST /api/complete", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 503 when the AI Gateway is not configured", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "");
    vi.stubEnv("AI_GATEWAY_TOKEN", "");

    const response = await POST(
      makeRequest({ slug: VALID_SLUG, messages: [{ role: "user", content: "ciao" }] }),
    );

    expect(response.status).toBe(503);
  });

  it("returns 400 when slug is missing", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const response = await POST(makeRequest({ messages: [{ role: "user", content: "ciao" }] }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when messages is missing or invalid", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const missing = await POST(makeRequest({ slug: VALID_SLUG }));
    expect(missing.status).toBe(400);

    const badRole = await POST(
      makeRequest({ slug: VALID_SLUG, messages: [{ role: "system", content: "ciao" }] }),
    );
    expect(badRole.status).toBe(400);

    const empty = await POST(makeRequest({ slug: VALID_SLUG, messages: [] }));
    expect(empty.status).toBe(400);
  });

  it("returns 404 when the recipe slug doesn't exist", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const response = await POST(
      makeRequest({ slug: "ricetta-inesistente-xyz", messages: [{ role: "user", content: "ciao" }] }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 502 when the model response is not valid JSON matching the schema", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ provider: "test", model: "auto:balanced", text: "non e' json" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({ slug: VALID_SLUG, messages: [{ role: "user", content: "quanto dura in frigo?" }] }),
    );

    expect(response.status).toBe(502);
  });

  it("retries an initial 502 from the AI Gateway before returning success", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "");
    vi.stubEnv("GITHUB_CONTENT_REPO", "");

    const modelOutput = validModelOutput();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "temporary gateway failure" }), { status: 502 }))
      .mockResolvedValueOnce(gatewayResponse(modelOutput));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({ slug: VALID_SLUG, messages: [{ role: "user", content: "quanto dura in frigo?" }] }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ signals: modelOutput.signals });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://gateway.example/complete",
      "https://gateway.example/complete",
    ]);
  });

  it("parses and validates a well-formed model response, attaching bookkeeping fields", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const modelOutput = validModelOutput();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ provider: "test", model: "auto:balanced", text: JSON.stringify(modelOutput) }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [
          { role: "user", content: "quanto dura il concentrato in frigo oltre i giorni indicati?" },
          { role: "assistant", content: "La ricetta indica una shelf-life di riferimento, oltre non e garantita." },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.schema_version).toBe("2");
    expect(json.recipe_slug).toBe(VALID_SLUG);
    expect(typeof json.date_bucket).toBe("string");
    expect(json.date_bucket).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof json.session_ref).toBe("string");
    expect(json.session_ref.length).toBeGreaterThan(0);
    expect(json.has_pii_risk).toBe(false);
    expect(json.redaction_notes).toBeNull();
    expect(json.signals).toEqual(modelOutput.signals);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.example/complete");
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.model).toBe("auto:balanced");
    expect(sentBody.stream).toBe(false);
    expect(typeof sentBody.input).toBe("string");
    expect(typeof sentBody.system).toBe("string");
  });

  it("includes assistant model metadata in the transcript and accepts assistant-origin signals", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const modelOutput = {
      has_pii_risk: false,
      redaction_notes: null,
      signals: [
        {
          topic_key: "raffreddamento-rapido-polpo",
          gap_type: "missing_info",
          answer_source: "general_knowledge",
          topic_summary: "Serve una nota esplicita sul raffreddamento rapido dopo la cottura.",
          confidence: 0.8,
          recipe_scope: "new_recipe",
          origin: {
            source: "assistant",
            model: "gpt-5.6-terra",
          },
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ provider: "test", model: "auto:balanced", text: JSON.stringify(modelOutput) }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [
          { role: "user", content: "Come raffreddo il polpo dopo la cottura?" },
          {
            role: "assistant",
            content: "Va raffreddato rapidamente prima della conservazione.",
            model: "gpt-5.6-terra",
          },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.signals).toEqual(modelOutput.signals);

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.input).toContain("assistant (model: gpt-5.6-terra): Va raffreddato rapidamente prima della conservazione.");
  });

  it("uses guide content when kind is set to guide", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const modelOutput = validModelOutput();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ provider: "test", model: "auto:balanced", text: JSON.stringify(modelOutput) }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: "risotto-tecnica-mantecatura",
        kind: "guide",
        messages: [{ role: "user", content: "Spiegami meglio la mantecatura." }],
      }),
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);

    expect(sentBody.system).toContain("una guida di Danio");
    expect(sentBody.system).toContain("# Risotto: tecnica e mantecatura");
    expect(sentBody.system).toContain("# Markdown della guida");
    expect(sentBody.input).toContain('Sessione chat reale sulla guida "Risotto: tecnica e mantecatura"');
  });

  it("writes the validated signals to GitHub when GITHUB_CONTENT_PAT/REPO are configured", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "gh-pat");
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const modelOutput = validModelOutput();
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "quanto dura il concentrato in frigo oltre i giorni indicati?" }],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.has_pii_risk).toBe(false);
    expect(json.trace_persistence).toMatchObject({
      status: "persisted",
      reason: null,
      github_status: 201,
    });
    expect(json.trace_persistence.path).toMatch(
      /^webapp\/recipes\/chat-traces\/\d{4}-\d{2}-\d{2}\/cold-brew-coffee-[0-9a-f]{8}\.json$/,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [githubUrl, githubInit] = fetchMock.mock.calls[1];
    expect(githubUrl).toMatch(
      /^https:\/\/api\.github\.com\/repos\/daniele-quero\/cook\/contents\/webapp\/recipes\/chat-traces\/\d{4}-\d{2}-\d{2}\/cold-brew-coffee-[0-9a-f]{8}\.json$/,
    );
    expect((githubInit as RequestInit).method).toBe("PUT");
    expect((githubInit as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer gh-pat");

    const sentGithubBody = JSON.parse((githubInit as RequestInit).body as string);
    expect(typeof sentGithubBody.message).toBe("string");
    const decodedPayload = JSON.parse(Buffer.from(sentGithubBody.content, "base64").toString("utf-8"));
    expect(decodedPayload).toEqual({
      schema_version: "2",
      recipe_slug: VALID_SLUG,
      date_bucket: json.date_bucket,
      has_pii_risk: false,
      redaction_notes: null,
      signals: modelOutput.signals,
    });
    expect(decodedPayload.session_ref).toBeUndefined();
  });

  it("forces has_pii_risk to true when the transcript contains an email or phone, without calling GitHub", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "gh-pat");
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const modelOutput = validModelOutput();
    modelOutput.has_pii_risk = false;
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    const emailResponse = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "puoi scrivermi a mario.rossi@example.com per dettagli?" }],
      }),
    );
    expect(emailResponse.status).toBe(200);
    const emailJson = await emailResponse.json();
    expect(emailJson.has_pii_risk).toBe(true);
    expect(emailJson.trace_persistence).toEqual({
      status: "skipped",
      reason: "pii_risk",
      path: null,
      github_status: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    const phoneResponse = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "chiamami al +39 333 123 4567 se serve" }],
      }),
    );
    expect(phoneResponse.status).toBe(200);
    const phoneJson = await phoneResponse.json();
    expect(phoneJson.has_pii_risk).toBe(true);
    expect(phoneJson.trace_persistence).toEqual({
      status: "skipped",
      reason: "pii_risk",
      path: null,
      github_status: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("excludes signals with gap_type 'not_a_gap' from the payload persisted to GitHub", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "gh-pat");
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const modelOutput = {
      has_pii_risk: false,
      redaction_notes: null,
      signals: [
        {
          topic_key: "tempo-infusione-frigo",
          gap_type: "missing_info",
          answer_source: "insufficient",
          topic_summary: "L'utente chiede quanto puo durare il concentrato in frigo.",
          confidence: 0.7,
          recipe_scope: "current_recipe",
          origin: {
            source: "user",
            model: null,
          },
        },
        {
          topic_key: "temperatura-servizio",
          gap_type: "not_a_gap",
          answer_source: "recipe",
          topic_summary: "La domanda sulla temperatura di servizio era gia coperta dalla ricetta.",
          confidence: 0.9,
          recipe_scope: "current_recipe",
          origin: {
            source: "user",
            model: null,
          },
        },
      ],
    };
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "quanto dura in frigo e a che temperatura si serve?" }],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    // La risposta HTTP mantiene tutti i signal originali (incluso not_a_gap) per trasparenza/debug.
    expect(json.signals).toEqual(modelOutput.signals);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, githubInit] = fetchMock.mock.calls[1];
    const sentGithubBody = JSON.parse((githubInit as RequestInit).body as string);
    const decodedPayload = JSON.parse(Buffer.from(sentGithubBody.content, "base64").toString("utf-8"));
    expect(decodedPayload.signals).toEqual([modelOutput.signals[0]]);
  });

  it("returns a skipped trace outcome when there are no persistable signals", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "gh-pat");
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const modelOutput = {
      has_pii_risk: false,
      redaction_notes: null,
      signals: [
        {
          topic_key: "temperatura-servizio",
          gap_type: "not_a_gap",
          answer_source: "recipe",
          topic_summary: "La temperatura di servizio e gia coperta dalla ricetta.",
          confidence: 0.9,
          recipe_scope: "current_recipe",
          origin: {
            source: "user",
            model: null,
          },
        },
      ],
    };
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "A che temperatura lo servo?" }],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.signals).toEqual(modelOutput.signals);
    expect(json.trace_persistence).toEqual({
      status: "skipped",
      reason: "no_signals_to_persist",
      path: null,
      github_status: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts exactly 40 messages and rejects 41 with 400", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "");
    vi.stubEnv("GITHUB_CONTENT_REPO", "");

    const modelOutput = validModelOutput();
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    // Exactly 40 alternating user/assistant messages — must be accepted.
    const messages40 = Array.from({ length: 40 }, (_, i) =>
      i % 2 === 0
        ? { role: "user", content: "domanda" }
        : { role: "assistant", content: "risposta" },
    );
    const response40 = await POST(makeRequest({ slug: VALID_SLUG, messages: messages40 }));
    expect(response40.status).toBe(200);

    // 41 messages — must be rejected.
    const messages41 = Array.from({ length: 41 }, (_, i) =>
      i % 2 === 0
        ? { role: "user", content: "domanda" }
        : { role: "assistant", content: "risposta" },
    );
    const response41 = await POST(makeRequest({ slug: VALID_SLUG, messages: messages41 }));
    expect(response41.status).toBe(400);
    const errorBody = await response41.json();
    expect(errorBody.error).toContain("40");
  });

  it("does not attempt a GitHub call when GITHUB_CONTENT_PAT or GITHUB_CONTENT_REPO is missing", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");
    vi.stubEnv("GITHUB_CONTENT_PAT", "");
    vi.stubEnv("GITHUB_CONTENT_REPO", "");

    const modelOutput = validModelOutput();
    const fetchMock = makeRoutedFetchMock({ modelOutput });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: "quanto dura il concentrato in frigo?" }],
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.schema_version).toBe("2");
    expect(json.signals).toEqual(modelOutput.signals);
    expect(json.trace_persistence).toEqual({
      status: "skipped",
      reason: "github_not_configured",
      path: null,
      github_status: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the GitHub HTTP status and relative trace path when persistence is rejected", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    const gatewayToken = "gateway-secret-token";
    const githubToken = "github-secret-token";
    const privateMessage = "questo messaggio della chat non deve finire nei log";
    vi.stubEnv("AI_GATEWAY_TOKEN", gatewayToken);
    vi.stubEnv("GITHUB_CONTENT_PAT", githubToken);
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const fetchMock = makeRoutedFetchMock({ modelOutput: validModelOutput(), githubStatus: 503 });
    vi.stubGlobal("fetch", fetchMock);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: privateMessage }],
      }),
    );

    expect(response.status).toBe(502);
    expect(response.ok).toBe(false);
    const json = await response.json();
    expect(json.trace_persistence).toMatchObject({
      status: "failed",
      reason: "github_http_error",
      github_status: 503,
    });
    expect(json.trace_persistence.path).toMatch(
      /^webapp\/recipes\/chat-traces\/\d{4}-\d{2}-\d{2}\/cold-brew-coffee-[0-9a-f]{8}\.json$/,
    );
    expect(json.signals).toBeUndefined();

    const logs = infoSpy.mock.calls.map(([entry]) => JSON.parse(entry as string));
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: "api.complete.trace_persistence_failure",
        slug: VALID_SLUG,
        kind: "recipe",
        message_count: 1,
        message_content_size_total: privateMessage.length,
        persistence_status: "failed",
        reason: "github_http_error",
        github_status: 503,
      }),
    );
    const serializedLogs = JSON.stringify(logs);
    expect(serializedLogs).not.toContain(privateMessage);
    expect(serializedLogs).not.toContain(gatewayToken);
    expect(serializedLogs).not.toContain(githubToken);
  });

  it("returns an explicit error outcome when the GitHub trace write fails on the network", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    const gatewayToken = "gateway-secret-token";
    const githubToken = "github-secret-token";
    const privateMessage = "questo secondo messaggio della chat non deve finire nei log";
    vi.stubEnv("AI_GATEWAY_TOKEN", gatewayToken);
    vi.stubEnv("GITHUB_CONTENT_PAT", githubToken);
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");

    const modelOutput = validModelOutput();
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.startsWith("https://gateway.example")) {
        return gatewayResponse(modelOutput);
      }
      if (url.startsWith("https://api.github.com/")) {
        throw new Error("network error");
      }
      throw new Error(`URL non mockato: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: privateMessage }],
      }),
    );

    expect(response.status).toBe(502);
    expect(response.ok).toBe(false);
    const json = await response.json();
    expect(json.error).toBe("Non e stato possibile salvare i segnali della chat.");
    expect(json.signals).toBeUndefined();
    expect(json.trace_persistence).toMatchObject({
      status: "failed",
      reason: "github_network_error",
      github_status: null,
    });
    expect(json.trace_persistence.path).toMatch(
      /^webapp\/recipes\/chat-traces\/\d{4}-\d{2}-\d{2}\/cold-brew-coffee-[0-9a-f]{8}\.json$/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const logs = infoSpy.mock.calls.map(([entry]) => JSON.parse(entry as string));
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: "api.complete.trace_persistence_failure",
        slug: VALID_SLUG,
        kind: "recipe",
        message_count: 1,
        message_content_size_total: privateMessage.length,
        persistence_status: "failed",
        reason: "github_network_error",
        github_status: null,
      }),
    );
    const serializedLogs = JSON.stringify(logs);
    expect(serializedLogs).not.toContain(privateMessage);
    expect(serializedLogs).not.toContain(gatewayToken);
    expect(serializedLogs).not.toContain(githubToken);
  });

  it("logs only safe request metadata and classified outcomes", async () => {
    const privateMessage = "scrivimi a private.user@example.com";
    const gatewayToken = "gateway-secret-token";
    const githubToken = "github-secret-token";
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", gatewayToken);
    vi.stubEnv("GITHUB_CONTENT_PAT", githubToken);
    vi.stubEnv("GITHUB_CONTENT_REPO", "daniele-quero/cook");
    vi.stubGlobal("fetch", makeRoutedFetchMock({ modelOutput: validModelOutput() }));
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await POST(
      makeRequest({
        slug: VALID_SLUG,
        messages: [{ role: "user", content: privateMessage }],
      }),
    );

    expect(response.status).toBe(200);
    const logs = infoSpy.mock.calls.map(([entry]) => JSON.parse(entry as string));
    expect(logs).toContainEqual({
      event: "api.complete.request",
      slug: VALID_SLUG,
      kind: "recipe",
      message_count: 1,
      message_content_size_total: privateMessage.length,
    });
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: "api.complete.gateway_response",
        classification: "success",
        gateway_status: 200,
      }),
    );
    expect(logs).toContainEqual(
      expect.objectContaining({
        event: "api.complete.trace_persistence_skipped",
        persistence_status: "skipped",
        reason: "pii_risk",
        path: null,
        github_status: null,
      }),
    );

    const serializedLogs = JSON.stringify(logs);
    expect(serializedLogs).not.toContain(privateMessage);
    expect(serializedLogs).not.toContain(gatewayToken);
    expect(serializedLogs).not.toContain(githubToken);
  });
});
