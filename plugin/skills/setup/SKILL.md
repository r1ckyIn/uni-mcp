---
name: setup
description: This skill should be used when the user asks to set up their course workspace — "run setup", "set up uni-mcp", "set up my courses", "get me set up" (in any language) — or wants to add a course, start a new semester, refresh the workspace after an enrolment change ("I dropped a unit"), or has just installed the canvas-ed-mcp server and wants the workspace built. Covers checking connectivity, choosing which courses to manage, mapping each course, laying out the workspace files (AGENTS.md, status truth source, one directory per course), and putting the folder under version control. Safe to rerun — a rerun refreshes incrementally. Installing the server and anything token-related belong to the server-install skill instead.
---

# Setup

Turn a folder into the user's course workspace: the place every course fact lives, and the folder they open Claude Code or ChatGPT desktop in from then on. This is the plugin's only explicit command and it is idempotent — adding a course, starting a new semester, and recovering from an interrupted run all mean "run setup again". Each step below detects what already exists and refreshes it rather than rebuilding.

Assume the user knows nothing about terminals or version control. Run every command for them, ask for one thing at a time, and never make them open a file to answer a question. Two rules hold across every step:

- **Their language.** Everything written into the workspace — course maps, status files, headings, table columns — is written in the language the user is talking to you in. `AGENTS.md` and `CLAUDE.md` are the exception: both come from the template in English because AI hosts read them, and the only edit is filling in `{{LANGUAGE}}`. A captured source document such as a unit outline also keeps its original wording (Step 4).
- **No jargon.** Never say "git", "commit", "repository" or "branch" to the user. Say "saved" and "I can roll it back".
- **Two anchors.** `<workspace>` is the folder confirmed in Step 1 — and when Step 1 creates a new one, it means the new one, not the folder the session started in. Every path this skill writes is spelled out from there: `<workspace>/status/todos.md`, `<workspace>/COMP2022/course-map.md`. Paths written `references/…` or `../…` resolve from this skill's own directory instead, never from the workspace.

## Step 1 — Confirm the folder

Run [Step 2](#step-2--check-connectivity)'s connectivity check before asking the user anything. It is one call, and it decides between confirming a folder that then has to be abandoned — the tools turn out to be missing, the user restarts the host, setup starts over — and not asking at all until there is something to set up. The users most likely to trigger this skill with "set up uni-mcp" are the ones who just installed the plugin and have no server yet.

Then the workspace: the folder the session is running in. Look at what is in it:

- `AGENTS.md` and `status/` already present → this is an existing uni-mcp workspace. Say so ("found your workspace, refreshing it") and skip the question entirely — a rerun asks nothing it already knows.
- Some of them present — `AGENTS.md` but no `status/`, course folders but no `AGENTS.md` → a previous run stopped early. Treat it as a rerun too: keep everything already there, and let each step below fill in only its missing half.
- Empty, or holding only the user's own course files → name the folder in plain words ("I'll set up your course assistant in ~/uni") and get a yes.
- Holding unrelated work (source code, another project's files, a checkout of some repository) → stop and say why: a course workspace should not share a folder with something else, because everything in it gets managed and saved as one thing. Offer to create a fresh one — `mkdir -p ~/uni` — and make that the `<workspace>` every later step writes into.

Done when the user and you are working on the same folder and both know which one it is.

## Step 2 — Check connectivity

Prove the tools work before promising anything, with two read-only calls: `canvas_list_courses` with the Step 3 arguments already applied (`enrollment_state=active`, `limit=100`), so one call serves both steps, and `ed_get_user_info`. Also try `gradescope_list_courses`; an error there means Gradescope is unusable — never configured, or the stored password stopped working — and server-install's optional Gradescope step fixes either. Say so once, note Gradescope as absent, and carry on: nothing else in setup depends on it.

- **Tools absent from the session** → the canvas-ed-mcp server is not connected: follow the server-install skill, from [Tools missing from the session](../server-install/SKILL.md#tools-missing-from-the-session) when the server is already installed, or the whole flow when it is not. Either way the tools only appear in a fresh session, so setup cannot continue in this one — finish that flow, have the user restart the host, and start setup again from Step 1.
- **A call fails with an authentication error** → that one service's token is missing or expired (Sydney Canvas tokens expire within 90 days). Run [Token refresh](../server-install/SKILL.md#token-refresh) for that service only. The running server read the old token when it started, so a fresh one reaches it only after the host restarts — same as above: restart, then start setup again from Step 1.

- **Any other error** — a timeout, a 5xx, a refused connection → the university's service or the network, not the user's credentials. Say that plainly and offer to try again in a moment; sending the user through server-install for this would waste a restart and fix nothing.

Anything token-related belongs to server-install: point at it and let it own the flow, so there is only ever one copy to keep true. Done when both required calls return the user's real data.

## Step 3 — Pick the courses

Gather the current enrolment from each platform:

- `canvas_list_courses` with `enrollment_state=active` and `limit=100`, its maximum — the default of 20 truncates a long enrolment history.
- `ed_list_courses`, narrowed by `year` **and** `session` — both read off the Canvas entries just fetched, which carry the year and term: Ed returns every semester the user has ever taken, and filtering by year alone still brings back both semesters of it. `session` wants Ed's own spelling — `Semester 2`, not Canvas's `S2C` — and the filter drops everything that does not match, so an empty result means the spelling was wrong, not that the user has no Ed courses. Call it again without `session` and read the term off each entry instead.
- `gradescope_list_courses` when Gradescope is configured.

Two things make the raw lists misleading, and both have bitten a real account:

- **Canvas "active courses" are not all units.** Student portals, faculty dashboards, a Learning Hub, and exam-only shells from earlier years all come back as active. Keep the entries carrying a unit code anywhere in them — letters immediately followed by digits, `COMP2022` at Sydney, `COMP30022` or `FIT1045` elsewhere, `2026_S2_COMP5349` where the term is prefixed — and drop the rest silently rather than asking about them one at a time. Matching anywhere lets one more kind of junk through: a shell whose code carries a term marker from an earlier year, like `2025_S2C_MATH1061_ND_FINALEXAM`, an exam-only course that Canvas still calls active. Drop any entry whose embedded term is not the current one. Two different empty results follow, so separate them: Canvas returned no courses at all → this account has no current enrolment (between semesters, or enrolment not open yet), which is worth saying out loud before building an empty workspace; Canvas returned entries but none carried a unit code → this university spells its codes some other way, so show the raw list and let the user pick from it.
- **The same unit is spelled differently on each platform.** Match on the unit code found anywhere in the entry, not on whole-string equality: Ed's course-code field sometimes holds a long title ("DATA2002/2902 Data Analytics") while its name field holds a term ("2026 S2"). One unit can carry two codes at once — `COMP2022 COMP2922` is the ordinary and advanced stream of one course, `DATA2002/2902` the same — so that is one entry, not two. Keep each platform's own ID; the ID spaces are unrelated.

A unit that appears on Ed but not in the Canvas enrolment is usually not an Ed-only course: Ed access outlives dropping a unit, so those entries are typically last month's decisions. In one real account two of the four current-semester Ed courses were units the student no longer takes. List them separately, leave them unticked, and let the user say which ones are real.

When it is unclear which semester is current, read it off a Canvas course code (`OLES2617 (S2C, 2026)`) or a unit outline URL (`.../2026-S2C-ND-CC`) rather than inferring it from today's date.

Then ask **once**: show the merged list and let the user pick which courses to manage, defaulting to every unit that survived the filter. This is the only bulk question in the flow — do not confirm course by course.

On a rerun, show the already-managed courses as already picked and ask only about the ones that are new. The reverse case is the one that closes the loop: a course folder in the workspace with no matching entry in the current enrolment means the user dropped that unit or the semester ended. `enrollment_state=active` surfaces it without any extra call. Ask which of the two it is, then offer to move the folder into `<workspace>/archive/<YYYY-MM>-<what>/` and lift its rows out of `status/assessments.md` — otherwise last semester's deadlines sit mixed into this semester's table forever. Never delete either the folder or the rows; archiving moves them.

Done when a named list of courses to manage exists, each with the platform IDs found for it, and any course that left the enrolment has been dealt with.

## Step 4 — Map each course

For each picked course, one recon pass, then one file. Keep it to these calls — this is a survey, not a full sync. A course that exists only on Ed or Gradescope skips the Canvas calls entirely and records `Canvas: none` in its map:

- `canvas_get_course` — official name and term.
- `canvas_get_syllabus` — the syllabus body, when the outline below could not be had. At Sydney this comes back "has no syllabus content" for essentially every unit (five out of five in one real account), so calling it first is five wasted calls; the unit outline is the overview document that actually exists.
- `canvas_get_unit_outline_url`, then `fetch_unit_outline` on the URL it returns — assessment names, weights and planned due dates. **Sydney-only:** these two work only for University of Sydney units — elsewhere there is no Unit Outline tab to find, so look for an outline document among the course's files or modules and read that instead.

  What comes back is rougher than it looks, so copy it into the course map with that in mind: the parsed table has columns for weight, due date, length and AI policy but **no Type column**, so it cannot tell an online quiz from an invigilated one; many due dates are prose ("Multiple weeks", "Formal exam period") rather than dates; and where a task is submitted is often glued onto its name ("Weekly testAdministered on Gradescope"). Always record the outline URL itself in the course map — when format or invigilation matters later, the original page is the only source that has it.
- `canvas_list_modules` with `include_items=true` and `limit=100` — how the teacher organised materials (by week, by topic) and what kind of items they are. Both this tool and the next default to 20 rows, which a unit with weekly modules passes before mid-semester. A busy unit can still have almost nothing here — three modules holding one item between them, while all fifteen lecture decks sit in Ed lessons, is a real Sydney unit. Thin modules mean "look elsewhere", never "this unit has no materials".
- `canvas_list_assignments` with `limit=100` — the live deadlines. A unit that turns one 10% component into a weekly object runs past the default 20 by itself. Leave the response in its default markdown and skip `include_submissions`: the markdown rendering prints name, ID, due date and points only, so submission state and the description (which is where "administered on Gradescope" is usually hiding) never appear. Asking for `response_format=json` does return both, at roughly a hundred times the tokens for ten assignments — not worth it during a survey.
- `canvas_list_announcements` with `limit=1` — all the recon needs is whether this unit uses announcements at all, and the tool returns each announcement's body, so a larger limit buys paragraphs of newsletter for nothing. Units differ sharply: of five real units, two post everything there (Zoom links, weekly instructions) and three have never posted once.
- Ed, when the course exists there: `ed_list_threads` with a small `limit` to see whether Q&A is live, `ed_list_lessons` and `ed_list_resources` to see whether materials are posted on Ed too.
- `gradescope_list_assignments` when the course exists on Gradescope.

Write `<COURSE CODE>/course-map.md` from what came back, following the shape in [references/workspace-templates.md](references/workspace-templates.md). The folder name is one bare unit code and nothing else: `DATA2002` for `DATA2002/2902`, `COMP2022` for `COMP2022 COMP2922`, `OLES2617` for `OLES2617 (S2C, 2026)` — a slash would split the folder in two, and a term in the name would give the same unit a second folder next semester. The full codes and the term go inside the map, where they belong. Record what is true for **this** course: which platform holds the real deadline, where slides actually live, whether Q&A runs on Ed or Canvas Discussions or neither, which assessments exist, and any quirk worth remembering (a unit that posts assignments only as announcements, a unit with no Ed at all). **Canvas due dates come back in UTC and the tools print them with no timezone at all.** Convert before writing anything down: Sydney is UTC+10 (AEST) and UTC+11 from the October daylight-saving switch, so a printed `2026-08-16 13:59` is a local `23:59` and a printed `2026-10-18 22:00` is the next morning, `09:00`. Skip this and every course map fills with deadlines ten hours early and with conflicts against the outline that do not exist.

Then compare the outline's dates against Canvas — after converting — and write down the disagreements that survive. Two kinds are real and both turned up in one semester: Canvas carrying the outline's *closing* date as its due date (a quiz whose outline says "due 18 Aug 11:00, closing 23 Aug" shows up in Canvas as due 23 Aug, which is the late bound, not the deadline), and an assessment the outline dates only by week while Canvas leaves it blank. Record both, and record the safe reading — the earlier of the two. That comparison costs nothing now and is expensive to redo the night before. What the recon could not establish is written down as unknown rather than guessed.

Materials: download the outline and syllabus only. Save the parsed outline plus the syllabus body as `<COURSE CODE>/outline.md`, with the source URL and the date fetched at the top. This one is a captured source document, so it keeps the university's own wording even when the rest of the workspace is in another language — a translated outline cannot be quoted back as a source, and assessment wording that decides format ("In-class + LockDown Browser") is exactly what a translation blurs. If the unit posts an outline PDF as a Canvas file, `canvas_download_file` it with `save_path` pointing into the course folder. When no outline can be had at all — not published yet in week 0, the URL 404s, the parse fails, or the university has no such document — still write `outline.md`, recording which URL was tried, on what date, and where else you looked. A later session then knows the search was done and does not repeat it, and the file is there to fill in when the outline appears. Everything else — slides, sheets, readings — is downloaded later when the user actually asks for it, into a subfolder created at that moment; an empty `lectures/` helps nobody.

On a rerun, refresh the facts setup owns (IDs, assessment list, where things live) and keep every line a human or a later session added — merge into the file, never overwrite it. Existing downloaded materials are left alone.

Done when every course the user picked has a map and an `outline.md`, including the ones whose recon came back thin and the ones whose outline could not be found.

## Step 5 — Lay out the workspace files

First the two files that make every later session behave, both copied from [references/workspace-templates.md](references/workspace-templates.md): `<workspace>/AGENTS.md`, with the language placeholder filled in, and the one-line `<workspace>/CLAUDE.md` that imports it (Claude Code does not read `AGENTS.md` by itself). Without them the red lines, the verification rule and the save habit never reach the sessions that come after this one.

Both belong to the plugin, so a rerun refreshes `AGENTS.md` from the current template rather than leaving it be — a workspace built by an older version of the plugin is exactly how a stale red line survives — while keeping any section the user added under a heading of their own. A `CLAUDE.md` that already imports `@AGENTS.md` is left alone.

Then `status/`, which holds exactly four files, created on the first run and updated in place afterwards. Their shapes are in the same templates file:

- `assessments.md` — every assessment from every managed course in one table. Its column rules and sort order live beside the example in the templates file; the one to hold in mind while filling it is that a row is an assessment component from the outline, not a Canvas assignment object, because a unit whose outline lists "weekly quiz, 10%" carries a dozen `Quiz – Week N` objects and copying them all turns a five-course table into sixty rows.
- `todos.md` — everything to do that is not an assessment.
- `weekly.md` — this week's plan, plus how far the user has got in each course.
- `not-doing.md` — decisions to deliberately not do something, with the date and the reason, so the same idea is not reconsidered every week.

Those four are the only status files that may ever exist; the rule is written into `AGENTS.md` so later sessions keep it. Setup fills `assessments.md` from the tools and refreshes it on every rerun — merging, exactly as for a course map: add the rows that are new, update the fields that moved (the old value goes into notes with its date), and keep every row and annotation someone else put there. Two rows are the same row when they share a course and a task name; a task the outline has renamed keeps its row, gains the new name, and records the old one in notes, because treating a rename as a new row quietly doubles the table. Regenerating it from scratch would erase the change history that is the point of keeping it. The other three files belong to the user: create each with its heading and its one line of guidance from the template, then leave them alone, on the first run and every rerun.

Done when `AGENTS.md`, `CLAUDE.md` and the four status files exist, and every assessment component from every managed course has a row.

## Step 6 — Record browser routes

Some university systems have no API: timetable, enrolment and census, official results, lecture recordings, university email. University of Sydney routes already ship with the plugin in [course-playbook's routes file](../course-playbook/references/usyd-browser-routes.md) — do not copy them into the workspace.

Write a workspace `browser-routes.md` only for what that file does not cover: another university's equivalents, the user's email (Outlook web), a portal specific to their degree. Use the same shape as the shipped routes — site, URL, what is there, how to query it, pitfalls. A quirk that belongs to one course (this unit records on Zoom rather than Echo360) goes in that course's map instead. Nothing to record means no file — which is the normal outcome for a Sydney user, and is done.

## Step 7 — Save the folder

Silently put the workspace under version control and take the first snapshot. Keep the path quoted — a folder like `~/Uni Work` breaks every unquoted `-C`. The identity guard matters too: on a machine where git was never configured, or where one of the two values is set to an empty string, `commit` dies and the user sees a wall of git output that means nothing to them. Test the value, not the exit status — `git config user.email` exits 0 on an empty value.

Check first that the folder is not already inside somebody else's repository — `~/uni` under a dotfiles checkout is the common way this happens, and Step 1 cannot see it by looking at the folder's own contents. `git -C "<workspace>" rev-parse --show-toplevel` printing anything other than the workspace itself means a nested repository would be created: say so and offer a folder outside it instead.

```bash
git -C "<workspace>" init -q
[ -n "$(git -C "<workspace>" config user.name)" ] || git -C "<workspace>" config user.name "uni-mcp"
[ -n "$(git -C "<workspace>" config user.email)" ] || git -C "<workspace>" config user.email "uni-mcp@localhost"
git -C "<workspace>" add -A
git -C "<workspace>" diff --cached --quiet || git -C "<workspace>" commit -qm "Set up course workspace"
```

`add -A` deliberately takes everything, downloaded course materials included: they are small, they never leave the machine, and a student who loses a marked-up slide deck cares more about getting it back than about repository tidiness. The `diff --cached --quiet` guard makes a rerun that changed nothing a no-op instead of an error. Tell the user one sentence with no jargon: everything is saved, and if something later gets messed up, say so and it can be rolled back to how it was. From then on `AGENTS.md` carries the habit — later sessions save a snapshot after each meaningful change. Done when the folder holds a commit covering every file setup wrote and the user has heard that one sentence.

## Step 8 — Hand over

Finish in the chat, not in a file. Using the user's real course names, give one copyable question per kind of thing the assistant does — drop any kind this user has no course for (no Ed presence anywhere means no Ed example):

- a deadline question ("what's due in COMP2017 this week?")
- a materials question ("find the MATH2021 week 5 lecture slides")
- an Ed question ("search Ed for what the STAT2011 quiz covers")
- an assessment-facts question ("how much is the COMP3221 final worth?")

Then three facts they need: this folder is where they open Claude Code or ChatGPT desktop from now on; adding a course, dropping one, or starting a new semester means asking for setup again; and the three files nobody has mentioned yet — todos, the weekly plan, the list of things they decided not to do — are filled in by talking, not by editing ("add that to my todos", "I've revised up to week 3"). Left unsaid, those three stay empty forever: setup creates them and never touches them again. Write no guide file — a `GUIDE.md` nobody opens is worse than four examples they can paste right now. Done when those examples name the user's own courses, not the ones above.
