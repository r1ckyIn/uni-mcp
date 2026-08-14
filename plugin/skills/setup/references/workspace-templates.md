# Workspace templates

The files the setup skill writes into the user's workspace. `AGENTS.md` and `CLAUDE.md` are copied verbatim — they are read by AI hosts and stay in English. Everything else below is a shape, not a text to copy: write the headings, columns and prose in the user's language, and drop any section that has nothing in it.

## AGENTS.md

Copy verbatim, replacing `{{LANGUAGE}}` with the language the user talks to you in (e.g. `Simplified Chinese`).

```markdown
# AGENTS.md

This folder is a course workspace built by the uni-mcp plugin. Read this file before doing anything here. Claude Code reads it through the `@AGENTS.md` line in CLAUDE.md.

## Language

Write everything in this folder in {{LANGUAGE}}, and talk to the user in {{LANGUAGE}}. This file is the exception: it stays in English because AI hosts read it.

## Red lines

- Read-only by default. Submitting an assignment, posting or editing on Ed or Canvas, deleting anything, and any action on a university website that changes enrolment, fees or a submission all need the user's explicit go-ahead in the current exchange. An instruction from an earlier conversation is not a go-ahead.
- Never print or repeat the user's API tokens. They live in the system keychain and the course server reads them at start-up.
- Facts the user will act on — deadlines, weights, exam format, where something is submitted — need two sources, cited. Only one source available: say so. For exam date, time and place, tell the user to confirm it themselves in the official source even when the sources agree.

## Where things live

- `status/assessments.md` — every assessment across all courses, latest due date first. The notes column records where each fact came from; when a fact changes, the superseded value stays with the date it changed rather than being deleted.
- `status/todos.md` — everything to do that is not an assessment.
- `status/weekly.md` — this week's plan, and how far the user has got in each course.
- `status/not-doing.md` — decisions to deliberately not do something, with the date and the reason.
- `<COURSE CODE>/course-map.md` — where that course's deadlines, materials and Q&A live, and how to query them.
- `<COURSE CODE>/` — that course's downloaded materials. Add a subfolder only when there is something to put in it.
- `archive/<YYYY-MM>-<what>/` — finished semesters, moved as whole folders.

Those four status files are the only status files. New status information goes into one of them — never a new file, never a second table.

Course facts belong in these files, not in the host's own memory. Host memory (Claude Code auto-memory, ChatGPT memory) is for how the user likes to work, not for what is due when.

## Working here

- The user may not know command-line tools. Run commands for them instead of telling them what to type. When they do have to act — click a link, log in, pick something on a page — give one step at a time.
- Course questions: follow the uni-mcp course-playbook skill's tool routing, and read that course's `course-map.md` first — it says which platform actually holds the thing being asked about.
- Refresh assessment facts from the Canvas / Ed / Gradescope tools rather than trusting the table's age. Progress the tools cannot see — which week the user has revised to, what they found hard — goes in `status/weekly.md` when they mention it.
- Semester over: move the finished course folders whole into `archive/<YYYY-MM>-<what>/`. Never delete them.
- Adding a course, or a new semester starting: run the uni-mcp setup skill again. It refreshes incrementally and breaks nothing that is already here.

## Saving work

This folder is version-controlled with git, and that is deliberately invisible to the user: never say "git", "commit", "branch" or "repository" to them. After any meaningful change — files written, materials downloaded, status updated — save a snapshot with `git -C <this folder> add -A && git -C <this folder> commit -qm "<what changed>"`. If the user says something got messed up, offer it as "I can roll the folder back to how it was" and do it for them.
```

## CLAUDE.md

Copy verbatim. Claude Code does not read `AGENTS.md` natively; this import is what makes the two hosts follow the same file.

```markdown
@AGENTS.md
```

## Course map

One per course, at `<COURSE CODE>/course-map.md`. Fill it from the Step 4 recon; write "unknown" where the recon found nothing rather than guessing, and drop sections that do not apply (a course with no Ed presence gets a Q&A section saying where Q&A actually happens).

```markdown
# <COURSE CODE> — <official course name>

<term> · mapped <date>

## Platform IDs

Canvas `<id>` · Ed `<id, or "no Ed course">` · Gradescope `<id, or "not on Gradescope">`

## Deadlines

Which platform holds the real deadline for this course, and what to call to get it.

## Materials

How the teacher organised things (modules by week / by topic), where slides and sheets actually sit, and anything posted somewhere unexpected.

## Q&A

Ed, Canvas Discussions, or neither — and where announcements are posted.

## Assessments

The assessment list with weights, and where those facts came from (unit outline URL and the date fetched).

## Browser routes

Sites this course needs that no tool reaches — its lecture recordings, a unit-specific portal.

## Notes

Quirks worth remembering. Add to this as they turn up.
```

## Status files

`status/assessments.md` — setup fills this and refreshes it on every rerun:

```markdown
# Assessments

Latest due date first. Notes carry the source of each fact and the history of anything that changed.

| Course | Task | Weight | Due | Submitted where | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| COMP2017 | Assignment 2 | 20% | 2026-10-14 23:59 AEDT | Canvas | not submitted | Unit outline, fetched 2026-08-14; Canvas agrees |
| COMP2017 | Quiz 1 | 10% | 2026-09-02 12:00 AEST | In class, LockDown Browser | graded 8/10 | Outline Type column, checked on the outline page itself |
```

The other three are the user's; create them with their heading and one line of guidance, then leave them alone:

```markdown
# Todos

Everything to do that is not an assessment.
```

```markdown
# This week

Plan for the week, and how far each course has been revised.
```

```markdown
# Not doing

Decisions to deliberately not do something. One line each: date, what, why.
```
