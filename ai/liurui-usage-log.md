# AI Usage Log Liu Rui

Below are the key prompts used during development. These represent actual conversations with the AI assistant. In all cases architecture was defined first manually. AI was only used for implementation support after design was finalised.

Many prompts required providing full context of existing codebase and architectural constraints. For brevity log entries show only the core request command.

---

## Log Entry 1

# Date/Time:

2026-03-29 14:20
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**

> check my ai service and tell me if anything is wrong
> **Output Summary:**
> Reviewed route flow, auth order, and basic validation checks in the AI service.
> **Action Taken:**

- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
      **Author Notes:**
      Used the review as a checklist and updated small parts after manual verification.

---

## Log Entry 2

# Date/Time:

2026-04-02 11:08
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**

> help me add rate limit for ai endpoint
> **Output Summary:**
> Suggested two limit windows and middleware order for the explain endpoint.
> **Action Taken:**

- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
      **Author Notes:**
      Kept the approach but adjusted limits/messages to fit team usage.

---

## Log Entry 3

# Date/Time:

2026-04-08 16:41
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**

> make ai explain code without giving full answer
> **Output Summary:**
> Proposed prompt rules that focus on hints, concepts, and guiding questions.
> **Action Taken:**

- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
      **Author Notes:**
      Simplified wording and removed strict parts that made responses too rigid.

---

## Log Entry 4

# Date/Time:

2026-04-12 20:06
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**

> fix json parsing when gemini returns code block
> **Output Summary:**
> Suggested stripping markdown fences before parse and returning safe fallback fields.
> **Action Taken:**

- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
      **Author Notes:**
      Added fallback handling and tested with malformed response samples.
