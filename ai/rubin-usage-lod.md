# AI Usage Log rubin-usage-lod

Below are the key prompts used during development. These represent actual conversations with the AI assistant. In all cases architecture was defined first manually. AI was only used for implementation support after design was finalised.

Many prompts required providing full context of existing codebase and architectural constraints. For brevity log entries show only the core request command.

---

## Log Entry 1
# Date/Time:
2026-03-23 15:47
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> can you help me to find the rest of the code that requires migration from mongodb to firebase
**Output Summary:**
Found the rest of the mongodb related functions for the user to navigate to and change
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Verified that the functions found are indeed the functions that need to be changed/removed to ensure proper migration from mongodb to firebase

---

## Log Entry 2
# Date/Time:
2026-03-24 12:09
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> help me remove the unit tests that were written for mongodb
**Output Summary:**
Removed the tests that were written for mongodb 
**Action Taken:**
- [x] Accepted as-is
- [ ] Modified
- [ ] Rejected
**Author Notes:**
Verified that the tests being removed were only for mongodb

---

## Log Entry 3
# Date/Time:
2026-03-24 19:28
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> Help me update the readme based on the changes that I made during the migration of mongodb to firebase
**Output Summary:**
Generated a updated Readme with changes to firebase in terms of testing and documentation
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
Corrected architecture details, and updated certain parts that were missed out due to found misses in the tests that were not completely removed

---

## Log Entry 4
# Date/Time:
2026-03-26 11:31
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> Explain different implementation methods for service-to-service API calls in Node.js
**Output Summary:**
Provided code snippets for various networking libraries and syntax for making HTTP requests between internal services.
**Action Taken:**
- [ ] Accepted as-is
- [ ] Modified
- [x] Rejected
**Author Notes:**
I felt that the coupling of the 2 services was valid and instead of using the networking functions decided that calling the API created in the question service was ok

---

## Log Entry 5
# Date/Time:
2026-04-03 10:18
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> help me clean up the user service route validation and make the request handling more consistent
**Output Summary:**
Suggested validation and controller cleanup changes for the user service request flow
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
I used the suggestions as a reference and adjusted the request handling to match the existing user service patterns more closely.

---

## Log Entry 6
# Date/Time:
2026-04-10 14:12
**Tool:** Gemini (model: Gemini 3 Flash) 
**Prompt/Command:**
> How do I deploy a Node.js microservice to AWS Elastic Beanstalk using GitHub Actions?
**Output Summary:**
The AI provided a template for a GitHub Actions workflow that zips the source code and uses the aws-actions/beanstalk-deploy action.
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
I found that the template included the node_modules, so i updated the command to exclude the node_modules in the zipped file and deployed the docker using instructions found online instead 

---

## Log Entry 7
# Date/Time:
2026-04-12 16:31
**Tool:** GitHub Copilot (GPT-5.3-Codex)
**Prompt/Command:**
> I am having trouble with improving the output of the AI to give the answers left, can you suggest a few ways to improve it
**Output Summary:**
Generated multiple fixes that could help to improve the output of the prompting
**Action Taken:**
- [ ] Accepted as-is
- [x] Modified
- [ ] Rejected
**Author Notes:**
I felt that the places of improvements were valid but the changes in prompts could be further improved from the one the AI had, so i took the changes and modified it to better improve the prompting.

---
