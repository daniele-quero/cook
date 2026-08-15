export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

export const MAX_MESSAGE_LENGTH = 4_000;
export const MAX_CHAT_MODEL_LENGTH = 120;

export function isChatModelIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_CHAT_MODEL_LENGTH;
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length <= MAX_MESSAGE_LENGTH &&
    (message.model === undefined || isChatModelIdentifier(message.model))
  );
}
