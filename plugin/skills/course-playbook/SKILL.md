---
name: course-playbook
description: This skill should be used when the user asks about their university courses — "when is X due", "what's due this week", "find the lecture slides", "search Ed for this", "how much is the exam worth", "is the quiz online or in person", "what's my grade", "did I submit" — or needs a university website with no API (timetable, enrolment, official results, lecture recordings, degree rules, the university GitHub). Routes each question type to the right canvas-ed-mcp tool chain, with data pitfalls, source-priority rules, and the confirmation rule for write actions.
---

# Course Playbook

Static knowledge for answering course questions through the canvas-ed-mcp server (Canvas / Ed / Gradescope tools). Find the question type below and follow its tool chain — the right chain answers in one or two calls instead of paging through raw listings. Apply [Source priority](#source-priority), [Verification](#verification) and the [Read-only rule](#read-only-rule) to every answer.

Tool names below are canvas-ed-mcp tool names; the host may show them with a server prefix such as `mcp__canvas-ed-mcp__`.

## Deadlines and upcoming work

- "What's due" / "what's next": `canvas_get_upcoming` first — one call, all courses.
- Overdue check: `canvas_get_missing_submissions`.
- Date-range questions ("what's on next week"): `canvas_list_calendar`.
- Canvas's own todo list: `canvas_get_todo`.
- Everything in one course: `canvas_list_assignments`.

Pitfall — closing time ≠ due time. A Canvas assignment's due date is the real deadline; the "available until" / lock time is often later because it includes a late-submission window. Report the due date, and bring up the closing time only when the user asks about late submission.

## Finding course materials

- Start from the structure the teacher built: `canvas_list_modules`, then `canvas_list_module_items` for the relevant module. Go to `canvas_list_files` only when the modules view lacks the item or the exact filename is already known.
- Read a file's text: `canvas_get_file_content`. Save it locally: `canvas_download_file`.
- Content published as pages: `canvas_list_pages` / `canvas_get_page`. Syllabus body: `canvas_get_syllabus`.
- Materials posted on Ed instead: `ed_list_lessons` / `ed_get_lesson` for lesson content, `ed_list_resources` / `ed_download_resource` for attached files.
- Lecture recordings are not reachable through these tools — use a browser route (see [Browser routes](#browser-routes)).

## Searching Ed

- Looking for something specific: `ed_search_threads` — search, never page through listings.
- Read a hit in full, with answers and comments: `ed_get_thread`.
- Browsing recent activity ("anything new on Ed?"): `ed_list_threads`.
- Announcements live in two places: `canvas_list_announcements` and pinned or announcement threads on Ed — check both when completeness matters.

## Assessment facts (weight, format, hurdles)

- Fetch the official unit outline: `canvas_get_unit_outline_url`, then `fetch_unit_outline`. **Sydney-only:** these two tools work only for University of Sydney units — for other universities, rely on Canvas plus outline documents posted in the course.
- Cross-check the outline against `canvas_list_assignments`; `verify_assessment_coverage` does the outline-vs-Canvas comparison in one call.
- Pitfall — the Type column decides the real format. In the outline's assessment table, a task whose description says "Online quiz" can carry Type "In-class + LockDown Browser". The parsed outline sometimes drops that column: whenever format matters (online vs in-person, invigilation, LockDown Browser), fetch the outline URL directly (WebFetch on Claude Code, or the host's URL-fetch or browser tool) and read the original table.

## Grades and submissions

- Grades in one course: `canvas_get_grades`; across all courses: `canvas_get_all_grades`.
- "Did I submit?": `canvas_get_submission_status`; the submission itself: `canvas_get_my_submission`.
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

When the outline and Canvas disagree on a deadline, take the earlier one and tell the user about the conflict. Email is not reachable through these tools — direct the user to their inbox, or use a browser route when one exists.

## Verification

- Cross-check every key fact against at least two sources and cite them in the answer.
- Only one source available: say so — "single source, could not cross-check".
- Zero-tolerance facts (exam date, time, location): even after two sources agree, tell the user to confirm in the official source themselves.

## Read-only rule

Operate read-only by default. Run a write tool — `canvas_submit_assignment`, `canvas_post_discussion_entry`, `ed_post_thread`, `ed_post_comment`, `ed_reply_to_comment`, `ed_edit_thread`, `ed_accept_answer`, `ed_thread_action`, or any Ed workspace create/update/delete — only after the user explicitly confirms that specific action in the current exchange. A general instruction from an earlier turn is not confirmation.

## Browser routes

Some university systems have no API: timetable, enrolment and census, official results, lecture recordings, the university's own GitHub, digitised readings, degree rules. For those, read [references/usyd-browser-routes.md](references/usyd-browser-routes.md) and drive the browser along the recorded route. University of Sydney routes ship built in; to support a new site, add an entry to that file.
