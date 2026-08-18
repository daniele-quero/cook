import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 when the AI Gateway is not configured", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "");
    vi.stubEnv("AI_GATEWAY_TOKEN", "");

    const response = await POST(makeRequest({ slug: "test", message: "ciao" }));

    expect(response.status).toBe(503);
  });

  it("returns 400 when slug or message are missing", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const response = await POST(makeRequest({ message: "ciao" }));

    expect(response.status).toBe(400);
  });

  it("returns 404 when the recipe slug doesn't exist", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const response = await POST(makeRequest({ slug: "ricetta-inesistente-xyz", message: "ciao" }));

    expect(response.status).toBe(404);
  });

  it("forwards sanitized history, adds the response length policy and exposes the chat model header", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"text":"ciao"}\n\n', {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "x-model": "gpt-5.6-terra",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        slug: "cold-brew-coffee",
        message: "Dammi una sintesi pratica.",
        history: [
          { role: "user", content: "Prima domanda" },
          { role: "assistant", content: "Prima risposta", model: "gpt-5.6-terra" },
        ],
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-danio-chat-model")).toBe("gpt-5.6-terra");
    expect(await response.text()).toContain('data: {"text":"ciao"}');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://gateway.example/chat");

    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.model).toBe("auto:balanced");
    expect(sentBody.stream).toBe(true);
    expect(sentBody.messages[0].content).toContain("1600 caratteri");
    expect(sentBody.messages[0].content).toContain("Vuoi che continui con <argomento successivo>?");
    expect(sentBody.messages[1]).toEqual({ role: "user", content: "Prima domanda" });
    expect(sentBody.messages[2]).toEqual({ role: "assistant", content: "Prima risposta" });
    expect(sentBody.messages[3]).toEqual({ role: "user", content: "Dammi una sintesi pratica." });
  });

  it("omits frontmatter and editorial note from the recipe context sent to the chat model", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"text":"ciao"}\n\n', {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "x-model": "gpt-5.6-terra",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      makeRequest({
        slug: "maionese-frullatore-immersione",
        message: "Spiegami la fase di emulsione.",
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    const systemMessage = sentBody.messages[0].content;

    expect(systemMessage).not.toContain("title: \"Maionese con frullatore a immersione\"");
    expect(systemMessage).not.toContain("Sono andato a cercare una maionese più stabile");
    expect(systemMessage).toContain("# Maionese con frullatore a immersione");
    expect(systemMessage).toContain("## 1. Preparazione");
  });

  it("uses guide content when kind is set to guide", async () => {
    vi.stubEnv("AI_GATEWAY_URL", "https://gateway.example");
    vi.stubEnv("AI_GATEWAY_TOKEN", "token");

    const fetchMock = vi.fn().mockResolvedValue(new Response('data: {"text":"ciao"}\n\n', {
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "x-model": "gpt-5.6-terra",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      makeRequest({
        slug: "risotto-tecnica-mantecatura",
        kind: "guide",
        message: "Spiegami la mantecatura.",
      }),
    );

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    const systemMessage = sentBody.messages[0].content;

    expect(systemMessage).toContain("una guida di Danio");
    expect(systemMessage).toContain("# Risotto: tecnica e mantecatura");
    expect(systemMessage).toContain("## 1. Preparazione");
  });
});
