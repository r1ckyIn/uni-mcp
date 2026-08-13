# USYD Browser Routes

Routes for University of Sydney systems that have no API, reached with a browser using the user's logged-in session (Claude Code: claude-in-chrome; ChatGPT desktop: the official Chrome extension). Each entry is site → URL → what's there → how to query → pitfalls. To support a new site, add an entry in the same shape. For another university, treat these entries as the template — the same systems usually exist under different URLs.

## Timetable

- URL: `https://timetable.sydney.edu.au/even/student` in even calendar years, `https://timetable.sydney.edu.au/odd/student` in odd ones — the timetable system runs parallel per-year instances named by year parity, so pick the path from the current year.
- What's there: the personal class timetable — lecture, tutorial and lab times with rooms.
- How to query: open the URL in the logged-in browser; the timetable renders after UniKey sign-in.
- Pitfalls: the bare domain `timetable.sydney.edu.au` lands on an error page — always use a full `/even/student` or `/odd/student` path. The wrong-parity instance still logs in and renders, but shows the other year's timetable.

## Sydney Student

- URL: `https://sydneystudent.sydney.edu.au`
- What's there: enrolment (add or drop units), census dates, fees, and official results.
- How to query: sign in with UniKey and navigate from the portal menu.
- Pitfalls: official results are released here, not Canvas — Canvas totals are working grades only.

## Echo360 lecture recordings

- URL: via Canvas — course left sidebar → Recorded Lectures.
- What's there: lecture recordings for the unit; each recording offers a downloadable TXT transcript.
- How to query: open the unit in Canvas, follow Recorded Lectures, pick the week. Download the transcript to summarise or search a lecture without watching it.
- Pitfalls: recordings and transcripts are not exposed to the canvas-ed-mcp file tools — this route needs the browser.

## Zoom

- URL: via Canvas — course left sidebar → Zoom tab.
- What's there: links for live online classes, plus cloud recordings in units that use Zoom instead of Echo360.
- How to query: open the unit in Canvas and follow the Zoom tab.
- Pitfalls: not every unit enables the tab — its absence means the unit doesn't run scheduled Zoom classes, not that the link moved.

## University GitHub

- URL: `https://github.sydney.edu.au`
- What's there: the university's enterprise GitHub — assignment repos and starter code for computing units.
- How to query: sign in with UniKey; find repos under the unit's organisation.
- Pitfalls: this is not `github.com` — public GitHub accounts do not work here.

## Library digitised readings

- URL: via the unit's Canvas reading list (sidebar naming varies by unit), or `https://library.sydney.edu.au`
- What's there: digitised textbook excerpts and unit reading lists.
- How to query: prefer the Canvas reading-list entry — it deep-links to the digitised excerpt; the library site covers cross-unit search.
- Pitfalls: digitised excerpts sit behind the library's own viewer, not plain PDFs — reach them through the reading-list link rather than guessing a file URL.

## Handbook

- URL: `https://www.sydney.edu.au/handbooks`
- What's there: degree rules, unit-of-study descriptions, prerequisites and credit-point requirements.
- How to query: pick the year's handbook, then the faculty; unit pages are searchable by unit code.
- Pitfalls: handbook rules are per-year — for degree-rule questions, use the handbook of the user's commencement year, not the current one.
