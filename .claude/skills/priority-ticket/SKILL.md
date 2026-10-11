---
name: priority-ticket
description: Fetches the highest-priority ticket assigned to the currently logged-in user in Jira (via MCP) and starts working on it. Use at the start of a new task.
---
# Priority ticket
1. Query Jira via MCP: search for tickets assigned to the current user that are in "To Do" status, sort them by priority, and select the highest-priority ticket. Do not consider tickets already in "In Progress" or "Done".
2. Summarize its acceptance criteria.
3. Enter plan mode and propose an implementation plan (follow the conventions in AGENTS.md/CLAUDE.md, if they exist).
4. As soon as the user approves the plan, move the ticket to "In Progress".
5. Once the work is complete (with the PR already created in accordance with the rules in CLAUDE.md), move the ticket to "Done" and add a comment to the ticket containing the PR link.






