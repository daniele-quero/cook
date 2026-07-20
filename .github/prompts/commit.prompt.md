---
description: Create a commit with a compliant message from staged changes and push
  the current branch
argument-hint: 'Optional: message override, scope hint, or extra context'
model: GPT-5 mini (copilot)
agent: agent
source: mcp-catalog
source_version: 1.0.0
source_digest: sha256:ddf5e50aacedb15294b2b1c10ae4de99bfc3060dfb9c74e33c06e4d82b14ee9f
---

Call `read_file` on [`.github/instructions/git-commit.instructions.md`](../../.github/instructions/git-commit.instructions.md) as the canonical source of truth for allowed commit prefixes and workflow conventions.

Follow that instruction file end-to-end.

If input provides a valid message override, use it. A valid message should be recognized as a complete commit message, including a prefix and a short description. If the message is not valid, use it as context to generate a compliant commit message or to modify the actions to be taken.

Return only:
- commit message
- commit hash
- push result

${input:Optional context  message override, scope hint, or notes}
