## 2026-08-25T13:46:09Z

Fix interactive keyboard shortcuts during active exams in `app.js` (N/Right arrow -> next, P/Left arrow -> prev, A-E/1-5 -> select option, M -> toggle bookmark, proper focus guards, UI radio selection sync).
Freeze remaining timer duration on save/exit and resume cleanly with the exact saved `state.timeLeft`.
Verify all changes thoroughly with automated tests / syntax checks.
Report victory / handoff when completed.
