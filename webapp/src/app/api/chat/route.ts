import { NextResponse } from "next/server";
import { getRecipe } from "@/lib/recipes";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  slug?: unknown;
  message?: unknown;
  history?: unknown;
};

const MAX_RECIPE_CONTEXT_LENGTH = 18_000;
const MAX_MESSAGE_LENGTH = 4_000;

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const gatewayUrl = process.env.AI_GATEWAY_URL?.replace(/\/$/, "");
  const gatewayToken = process.env.AI_GATEWAY_TOKEN;

  if (!gatewayUrl || !gatewayToken) {
    return errorResponse("La chat non e configurata sul server.", 503);
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return errorResponse("Il corpo della richiesta non e JSON valido.", 400);
  }

  if (typeof body.slug !== "string" || typeof body.message !== "string") {
    return errorResponse("slug e message sono obbligatori.", 400);
  }

  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse("Il messaggio deve contenere da 1 a 4000 caratteri.", 400);
  }

  const recipe = getRecipe(body.slug);
  if (!recipe) return errorResponse("Ricetta non trovata.", 404);

  const history = Array.isArray(body.history) ? body.history.filter(isChatMessage) : [];
  const recipeContext = recipe.content.slice(0, MAX_RECIPE_CONTEXT_LENGTH);
  const systemMessage = [
    "Sei un assistente esperto di cucina, chimica degli alimenti, fisica e biosicurezza.",
    "Rispondi in italiano in modo pratico, preciso e proporzionato alla domanda.",
    "Quando parli di sicurezza alimentare, esplicita eventuali incertezze e non inventare temperature o tempi.",
    `L'utente sta consultando la ricetta \"${recipe.title}\". Usa questo Markdown come contesto:\n\n${recipeContext}`,
  ].join("\n\n");

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${gatewayUrl}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "auto:balanced",
        stream: true,
        messages: [
          { role: "system", content: systemMessage },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });
  } catch {
    return errorResponse("Il servizio chat non e raggiungibile.", 502);
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return errorResponse("Il servizio chat ha restituito un errore.", upstreamResponse.status || 502);
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": upstreamResponse.headers.get("content-type") ?? "text/event-stream",
    },
  });
}