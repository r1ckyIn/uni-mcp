---
name: course-playbook
description: This skill should be used when the user asks about their university courses — "when is X due", "what's due this week", "find the lecture slides", "search Ed for this", "how much is the exam worth", "is the quiz online or in person", "what's my grade", "did I submit" — or needs a university website with no API (timetable, enrolment, official results, lecture recordings, degree rules, the university GitHub). Routes each question type to the right canvas-ed-mcp tool chain, with data pitfalls, source-priority rules, and the confirmation rule for write actions.
---

# Course Playbook

Static knowledge for answering course questions through the canvas-ed-mcp server (Canvas / Ed / Gradescope tools). Find the question type below and follow its tool chain — the right chain answers in one or two calls instead of paging through raw listings. Apply [Source priority](#source-priority), [Verification](#verification) and the [Read-only rule](#read-only-rule) to every answer.

Tool names below are canvas-ed-mcp tool names; the host may show them with a server prefix such as `mcp__canvas-ed-mcp__`. If these tools are absent from the session, tell the user the canvas-ed-mcp server is not connected yet and offer to connect it via the server-install skill (reference: <https://github.com/r1ckyIn/uni-mcp>) — answer from real tool output or not at all.

Most tools need a course ID. Resolve it first — `canvas_list_courses` for Canvas, `ed_list_courses` for Ed, `gradescope_list_courses` for Gradescope — and match the user's course by code or name. The three platforms' ID spaces are unrelated: a Canvas course ID is meaningless on Ed, so resolve per platform rather than reusing an ID across them.

## Deadlines and upcoming work

- "What's due" / "what's next": `canvas_get_upcoming` first — one call, all courses. It covers only the near future (the dashboard's "Coming Up" window), so treat an empty result as "nothing imminent", not "nothing due" — fall back to `canvas_list_calendar` with a date range or per-course `canvas_list_assignments` before answering that nothing is due.
- Overdue check: `canvas_get_missing_submissions`.
- Date-range questions ("what's on next week"): `canvas_list_calendar`.
- Canvas's own todo list: `canvas_get_todo`.
- Everything in one course: `canvas_list_assignments`.

Pitfall — **the times these tools print are UTC, with no timezone shown.** Canvas stores due dates in UTC and the markdown output drops the marker, so `2026-08-16 13:59` is a Sydney deadline of `23:59` (UTC+10 in AEST, UTC+11 once daylight saving starts in October) and `2026-10-18 22:00` is the following morning at `09:00`. Convert to the user's local time before saying a deadline out loud, and never quote the raw figure — repeating it verbatim moves every deadline ten hours earlier and invents conflicts with the unit outline that do not exist.

Pitfall — closing time ≠ due time. A Canvas assignment's due date is the real deadline; the "available until" / lock time is often later because it includes a late-submission window. Report the due date, and bring up the closing time only when the user asks about late submission.

## Finding course materials

- Start from the structure the teacher built: `canvas_list_modules` (`include_items=true` gets the items in the same call; `search_term` narrows by module name), or `canvas_list_module_items` for one module. Go to `canvas_list_files` only when the modules view lacks the item or the exact filename is already known.
- `canvas_get_file_content` returns metadata and a download URL, not the file body. To read or summarise a file, `canvas_download_file` it and read the saved copy.
- Content published as pages: `canvas_list_pages` / `canvas_get_page`. Syllabus body: `canvas_get_syllabus`.
- Materials posted on Ed instead: `ed_list_lessons` / `ed_get_lesson` for lesson content, `ed_list_resources` / `ed_download_resource` for attached files.
- Lecture recordings are not reachable through these tools — use a browser route (see [Browser routes](#browser-routes)).

## Searching Ed

- Looking for something specific: `ed_search_threads` — search, never page through listings.
- Read a hit in full, with answers and comments: `ed_get_thread`.
- Browsing recent activity ("anything new on Ed?"): `ed_list_threads`.
- Announcements live in two places: `canvas_list_announcements` and pinned or announcement threads on Ed — check both when completeness matters.
- Units that run Q&A on Canvas Discussions instead of Ed: `canvas_list_discussions` / `canvas_get_discussion`.

## Assessment facts (weight, format, hurdles)

- Fetch the official unit outline: `canvas_get_unit_outline_url`, then `fetch_unit_outline`. **Sydney-only:** these two tools work only for University of Sydney units — for other universities, rely on Canvas plus outline documents posted in the course.
- Cross-check the outline against `canvas_list_assignments`. `verify_assessment_coverage` (also Sydney-only — it fetches the outline) flags missing assessments by comparing counts; it checks no weights, dates or names, so compare those fields yourself.
- Pitfall — the Type column decides the real format. In the outline's assessment table, a task whose description says "Online quiz" can carry Type "In-class + LockDown Browser". The parsed table has no Type column at all — it carries assessment, weight, due date, length and AI policy — so whenever format matters (online vs in-person, invigilation, LockDown Browser), fetch the outline URL directly (WebFetch on Claude Code, or the host's URL-fetch or browser tool) and read the original table.

## Grades and submissions

- Grades in one course: `canvas_get_grades`; across all courses: `canvas_get_all_grades`.
- "Did I submit?": `canvas_get_submission_status` — it groups a whole course's assignments by state (missing, overdue, not submitted, submitted, graded) with marks, and is the only tool that reports per-assignment state. `canvas_list_assignments` with `include_submissions=true` does not: its markdown output prints name, ID, due date and points only, and reaching the submission fields means `response_format=json`, which for ten assignments costs about a hundred times the tokens. The submission itself: `canvas_get_my_submission`.
- Peer-review tasks: `canvas_get_peer_reviews`.
- Assessments run on Gradescope: `gradescope_list_courses` / `gradescope_list_assignments`.

Canvas totals are working grades — official results are released in the student portal, not Canvas (see the routes file).

## Source priority

Different question types have different authoritative sources. Route by type:

| Question type | Authoritative source |
| --- | --- |
| Assessment weight, hurdle, planned due dates | Official unit outline |
| The live deadline right now | Canvas assignment object |
| Execution details (submission format, extensions, exam rules) | Ed staff FAQ / pinned staff posts |
| Time-sensitive notices (room change, cancellation) | Official university email |

When the outline and Canvas disagree on a deadline, present both dates, treat the earlier one as the safe deadline, and say why (commonly the outline is stale or Canvas carries an extension — the user can confirm which). Email is not reachable through these tools — direct the user to their inbox, or use a browser route when one exists.

## Verification

- Cross-check facts the user will act on — deadlines, weights, assessment format, exam logistics, grades — against at least two sources and cite both. Routine listings ("what modules exist") need no second source.
- Only one source available: say so — "single source, could not cross-check".
- Zero-tolerance facts (exam date, time, location): even after two sources agree, tell the user to confirm in the official source themselves.

## Read-only rule

Operate read-only by default. Run a write tool — `canvas_submit_assignment`, `canvas_post_discussion_entry`, `ed_post_thread`, `ed_post_comment`, `ed_reply_to_comment`, `ed_edit_thread`, `ed_accept_answer`, `ed_thread_action`, or any Ed workspace create/update/delete — only after the user explicitly confirms that specific action in the current exchange. A general instruction from an earlier turn is not confirmation.

The download tools (`canvas_download_file`, `ed_download_resource`) write to the local filesystem — by default into the current directory. Tell the user where the file landed, and pick a fresh name instead of overwriting an existing file.

## Browser routes

Some university systems have no API: timetable, enrolment and census, official results, lecture recordings, the university's own GitHub, digitised readings, degree rules. For those, read [references/usyd-browser-routes.md](references/usyd-browser-routes.md) — resolve that path from this skill's own directory, not the session working directory — and drive the browser along the recorded route. With no browser tool in the session, give the user the URL and tell them what to look for there.

The built-in routes are University of Sydney's; for another university, treat them as the template and record that university's own URLs. To support a new site, add an entry to that file.
