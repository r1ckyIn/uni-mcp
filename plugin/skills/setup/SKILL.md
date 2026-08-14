---
name: setup
description: This skill should be used when the user asks to set up their course workspace — "run setup", "set up uni-mcp", "set up my courses", "帮我配置课程助手" — or wants to add a course, start a new semester, or refresh the workspace after an enrolment change ("I dropped a unit", "new semester"), or has just finished installing the canvas-ed-mcp server and wants the workspace built. Covers checking connectivity, choosing which courses to manage, mapping each course, laying out the workspace files (AGENTS.md, status truth source, one directory per course), and putting the folder under version control. Safe to rerun — a rerun refreshes incrementally.
---

# Setup

Turn a folder into the user's course workspace: the place every course fact lives, and the folder they open Claude Code or ChatGPT desktop in from then on. This is the plugin's only explicit command and it is idempotent — adding a course, starting a new semester, and recovering from an interrupted run all mean "run setup again". Each step below detects what already exists and refreshes it rather than rebuilding.

Assume the user knows nothing about terminals or version control. Run every command for them, ask for one thing at a time, and never make them open a file to answer a question. Two rules hold across every step:

- **Their language.** Everything written into the workspace — course maps, status files, headings, table columns — is written in the language the user is talking to you in. The one exception is `AGENTS.md`, copied verbatim in English from the template because AI hosts read it.
- **No jargon.** Never say "git", "commit", "repository" or "branch" to the user. Say "saved" and "I can roll it back".

## Step 1 — Confirm the folder

The workspace is the folder the session is running in. Look at what is in it:

- `AGENTS.md` and `status/` already present → this is an existing uni-mcp workspace. Say so ("found your workspace, refreshing it") and skip the question entirely — a rerun asks nothing it already knows.
- Empty, or holding only the user's own course files → name the folder in plain words ("I'll set up your course assistant in ~/uni") and get a yes.
- Holding unrelated work (source code, another project's files, a checkout of some repository) → stop and say why: a course workspace should not share a folder with something else, because everything in it gets managed and saved as one thing. Offer to create a fresh one — `mkdir -p ~/uni` — and continue there.

## Step 2 — Check connectivity

Prove the tools work before promising anything, with two read-only calls: `canvas_list_courses` and `ed_get_user_info`. Also try `gradescope_list_courses` — an error there just means Gradescope was never configured, which is fine; note it as absent and carry on.

- **Tools absent from the session** → the canvas-ed-mcp server is not connected. Run the [server-install skill](../server-install/SKILL.md), then come back to Step 1.
- **A call fails with an authentication error** → that one service's token is missing or expired (Sydney Canvas tokens expire within 90 days). Run the token-refresh part of the [server-install skill](../server-install/SKILL.md) for that service only, then retry the call.

Do not repeat token instructions here — server-install owns that flow, and a second copy would drift.

## Step 3 — Pick the courses

Gather the current enrolment from each platform:

- `canvas_list_courses` with `enrollment_state=active` — that filter is what keeps finished courses out. Raise `limit` above its default of 20 so a long enrolment history is not silently cut off.
- `ed_list_courses`, narrowed with `year` and `session` to the current semester.
- `gradescope_list_courses` when Gradescope is configured.

Merge the three lists by course code. The platforms' ID spaces are unrelated, so keep all three IDs per course rather than reusing one. Then ask **once**: show the merged list and let the user pick which courses to manage, defaulting to all active Canvas courses. This is the only bulk question in the flow — do not confirm course by course.

On a rerun, show the already-managed courses as already picked and ask only about the ones that are new. A course the user no longer takes stays on disk; setup never deletes a course folder (semester-end archiving is in `AGENTS.md`).

## Step 4 — Map each course

For each picked course, one recon pass, then one file. Keep it to these calls — this is a survey, not a full sync:

- `canvas_get_course` — official name and term.
- `canvas_get_syllabus` — the syllabus body.
- `canvas_get_unit_outline_url`, then `fetch_unit_outline` on the URL it returns — assessment names, weights and planned due dates. **Sydney-only:** for any other university these two fail; look instead for an outline document among the course's files or modules and read that.
- `canvas_list_modules` with `include_items=true` — how the teacher organised materials (by week, by topic) and what kind of items they are.
- `canvas_list_assignments` with `include_submissions=true` — live deadlines plus what is already submitted.
- `canvas_list_announcements` — whether this unit actually posts announcements on Canvas.
- Ed, when the course exists there: `ed_list_threads` with a small `limit` to see whether Q&A is live, `ed_list_lessons` and `ed_list_resources` to see whether materials are posted on Ed too.
- `gradescope_list_assignments` when the course exists on Gradescope.

Write `<COURSE CODE>/course-map.md` from what came back, following the shape in [references/workspace-templates.md](references/workspace-templates.md). Course folders are named by course code alone — no semester, no year in the path. Record what is true for **this** course: which platform holds the real deadline, where slides actually live, whether Q&A runs on Ed or Canvas Discussions or neither, which assessments exist, and any quirk worth remembering (a unit that posts assignments only as announcements, a unit with no Ed at all). What the recon could not establish is written down as unknown rather than guessed.

Materials: download the outline and syllabus only. Save the parsed outline plus the syllabus body as `<COURSE CODE>/outline.md`, with the source URL and the date fetched at the top; if the unit posts an outline PDF as a Canvas file, `canvas_download_file` it with `save_path` pointing into the course folder. Everything else — slides, sheets, readings — is downloaded later when the user actually asks for it. Create no other subfolders: an empty `lectures/` helps nobody.

On a rerun, refresh the facts setup owns (IDs, assessment list, where things live) and keep every line a human or a later session added — merge into the file, never overwrite it. Existing downloaded materials are left alone.

## Step 5 — Write the status files

`status/` holds exactly four files, created on the first run and updated in place afterwards. Their shapes are in [references/workspace-templates.md](references/workspace-templates.md):

- `assessments.md` — every assessment from every managed course in one table, latest due date first. The notes column carries where each fact came from, and when a fact changes it keeps the superseded value with the date it changed instead of deleting it.
- `todos.md` — everything to do that is not an assessment.
- `weekly.md` — this week's plan, plus how far the user has got in each course.
- `not-doing.md` — decisions to deliberately not do something, with the date and the reason, so the same idea is not reconsidered every week.

Those four are the only status files that may ever exist; the rule is written into `AGENTS.md` so later sessions keep it. Setup fills `assessments.md` from the tools and refreshes it on every rerun; the other three belong to the user — create them with their heading and leave them alone from then on, on the first run and every rerun.

## Step 6 — Record browser routes

Some university systems have no API: timetable, enrolment and census, official results, lecture recordings, university email. University of Sydney routes already ship with the plugin in [course-playbook's routes file](../course-playbook/references/usyd-browser-routes.md) — do not copy them into the workspace.

Write a workspace `browser-routes.md` only for what that file does not cover: another university's equivalents, the user's email (Outlook web), a portal specific to their degree. Use the same shape as the shipped routes — site, URL, what is there, how to query it, pitfalls. A quirk that belongs to one course (this unit records on Zoom rather than Echo360) goes in that course's map instead. Nothing to record means no file.

## Step 7 — Save the folder

Silently put the workspace under version control and take the first snapshot. The identity guard matters: on a machine where git was never configured, `commit` fails and the user would see a wall of git output that means nothing to them.

```bash
git -C <workspace> init -q
git -C <workspace> config user.email >/dev/null 2>&1 || {
  git -C <workspace> config user.name "uni-mcp"
  git -C <workspace> config user.email "uni-mcp@localhost"
}
git -C <workspace> add -A
git -C <workspace> diff --cached --quiet || git -C <workspace> commit -qm "Set up course workspace"
```

The `diff --cached --quiet` guard makes a rerun that changed nothing a no-op instead of an error. Tell the user one sentence with no jargon: everything is saved, and if something later gets messed up, say so and it can be rolled back to how it was. From then on `AGENTS.md` carries the habit — later sessions save a snapshot after each meaningful change.

## Step 8 — Hand over

Finish in the chat, not in a file. Using the user's real course names, give three or four questions they can copy — one per kind of thing the assistant does:

- a deadline question ("what's due in COMP2017 this week?")
- a materials question ("find the MATH2021 week 5 lecture slides")
- an Ed question ("search Ed for what the STAT2011 quiz covers")
- an assessment-facts question ("how much is the COMP3221 final worth?")

Then two facts they need: this folder is where they open Claude Code or ChatGPT desktop from now on, and adding a course or starting a new semester means asking for setup again. Write no guide file — a `GUIDE.md` nobody opens is worse than four examples they can paste right now.
