# AI Usage Log ryan-usage-lod

Below are the key prompts used during development. These represent actual conversations with the AI assistant. In all cases architecture was defined first manually. AI was only used for implementation support after design was finalised.

Many prompts required providing full context of existing codebase and architectural constraints. For brevity log entries show only the core request command.

---

## Log Entry 1
# Date/Time:
2026-03-06 15:41
**Tool:** Gemini 3
**Prompt/Command:**
> Generate a docker compose file with the following: 
> - A slim, runtime
>
> The container's code must have: 
> - FastAPI, Pydantic as APIs 
> - A script file that supports Create, Update, Delete, and singular fetch operations to a hosted RabbitMQ on the cloud that will modify data on a MongoDB cluster (Title will be the key value) 
> - Create operation must check if the user has appropriate roles (Admin) and if the question data passes a schema check 
> - Update operation must check if the user has appropriate roles and if the question data passes a schema check and if the version number has not changed 
> - Delete operation must check if the user has appropriate roles and if the question title exists in the DB 
> - Single fetch operation will poll for a random qn by topic and difficulty 
>
> Possible modifications: Merge Create and Update operation into upsert operation
**Output Summary:**
Base implementation code for Question Service.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Modifications were made heavily due to an overcomplication of the architectural design which was identified by myself. The dockerfile, main.py, and compose.yaml were simplified to a cleaner manual implementation.

Affected Files: main.py, dockerfile, compose.yaml
Generated on 6th March 2026 15:41
Used as initial implementations, heavily simplified and removed after.

