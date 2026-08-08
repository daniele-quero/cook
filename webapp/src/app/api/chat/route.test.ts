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
});
