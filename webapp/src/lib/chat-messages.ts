export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const MAX_MESSAGE_LENGTH = 4_000;

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length <= MAX_MESSAGE_LENGTH
  );
}
