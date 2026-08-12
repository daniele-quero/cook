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
      },
    ],
  };
}

describe("POST /api/complete", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

    expect(json.schema_version).toBe("1");
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
});
