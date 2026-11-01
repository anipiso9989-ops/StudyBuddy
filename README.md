# StudyBuddy

StudyBuddy combines flashcards, daily habits, a Pomodoro timer, and a day and week planner in one self-contained HTML workspace. A persistent sidebar switches between all four tools without interrupting your focus timer.

## Getting started

Download `StudyBuddy.html` and open it in a modern browser. No installation, account, or server is required. Keep using the same browser profile and file location to access your saved data.

## Flashcards

Create named decks and enter one card per line using `front::back`. Both sides support Markdown and mathematical notation. Edit cards, rename decks, or delete either as needed. Use **Export** in a deck's toolbar to download just that deck as a JSON backup, including its cards and review progress. **Study** reviews due cards using spaced repetition, while **Cram** practices every card without changing its review schedule.

## Habits

Add daily habits, mark them complete, and track consecutive-day streaks. Undo today's completion when necessary. Habits can also be renamed or deleted.

## Tempo

Set work duration, break duration, and cycle count. Start, pause, resume, or reset your session. The timer continues when you switch tools. Choose an image or GIF background, use a direct image URL, restore the default image, or switch to a plain background. Ambient recordings include rain, fireplace, river, thunderstorm, crickets, and birds. An optional Spotify player accepts supported Spotify links and remembers your selection after reload.

## Slot

Add tasks with assigned dates, durations, deadlines, and priorities. Slot automatically updates schedules when tasks, deadlines, commitments, or availability change. Day and Week views show the current plan; there is no Generate or Push Tomorrow step.

Use **Edit** or **Delete** on tasks in the day schedule, Week previews, Tasks, Upcoming, or skipped history. The editor includes name, type, date, duration, deadline, priority, energy, single-block preference, chunk limits, and checklist contents/checkmarks. Saving recalculates schedules and keeps your selected date and view. Completed work retains its original times and labels; duration cannot fall below completed minutes, and increasing a completed task's duration reopens it. Deleted tasks go to **Tasks → Trash** and can be restored.

Use **Adjust / keep time** on an unfinished block to change its start time or keep its current placement. Automatic planning reserves that time until you choose **Release time**. If hours, commitments, or a deadline change around it, Slot keeps the placement and flags the conflict. Release kept times before changing that task's assigned date, duration, type, or chunk limits. Completed and skipped records remain in history. Skipped intervals stay clear during automatic retries.

At the start of a new local day, unfinished work rolls into the earliest available periods around assigned work, commitments, and kept times. Remaining chunks can span several days. Original deadlines, completed minutes, and checklist checkmarks stay unchanged. Slot places what fits before the deadline, then schedules excess work in the next feasible periods with a deadline warning. Work without a verified placement remains visible. Rollover checks while the page is open and catches up when reopened or brought into focus; a closed HTML file cannot run in the background. Catch-up searches the next 90 days.

Enable **Repeat task weekly** when adding either task type. Choose weekdays, every day, or individual days—for example, mathematics for 45 minutes every weekday. Each occurrence has its own deadline, time progress, and checklist. **Tasks → Recurring tasks** provides **Edit recurring task**, **Pause**, and **Resume**. Series edits update untouched occurrences from today onward; completed work, checkmarks, individually edited occurrences, deleted instances, and kept times remain intact. Pausing withdraws untouched future instances without deleting history. Resuming starts with today and does not backfill paused days. The app creates a rolling 35-day horizon and also creates the selected future week; reopening extends it without duplicates.

Under **Settings → Weekday availability**, save permanent hours or a day-off rule for selected weekdays. Use multiple windows for split days. **Edit hours** changes a rule and **Reset to default** restores 09:00–17:00. **Usable hours** still saves date-specific overrides, including days off, or seven explicit date overrides. Date overrides take precedence; **Use weekday rule** removes the selected date's override. Every change updates affected schedules.

Turn **Single block** on for an uninterrupted session; it starts off for timed tasks and on for checklist blocks. Slot tries one session first, then the fewest sessions its bounded search can verify. Creation immediately applies the resulting schedule and reports any split. A one-off single-block request without a verified placement is rejected atomically, leaving its draft and saved data intact. Recurring rules can be saved when occurrences cannot fit; those instances stay visible with warnings. With Single block off, manual chunk limits apply. Rollover uses available chunks across days and does not claim a globally minimal multi-day split.

Choose **Checklist block** for to-dos whose individual durations are unknown. Set the block's total duration and enter one item per line. Split sessions of the same occurrence share checkmarks; separate recurring occurrences have independent lists. **Edit** can rename a checklist block or change its items. Item checkmarks and completed time are independent and survive reloads, scheduling changes, rollover, and restoration.

Under **Settings → Fixed commitments**, enable **Repeat weekly** and choose repeat days, **Weekdays**, or **Every day**. Commitments repeat from their Starts date at the same local time and duration, including overnight commitments. **Edit** changes the series; **Delete series** removes it. Changes reschedule unfinished work automatically while protecting completed history and kept times.

## Keyboard shortcuts

Use `Alt+1`, `Alt+2`, `Alt+3`, and `Alt+4` to switch to Flashcards, Habits, Focus, and Slot. During flashcard review in Study or Cram, press Space or use **Show Answer / Show Front** to flip between the front and back as often as needed. With the answer visible, use Left or Right Arrow to grade it.

## Saving and backups

Flashcards, habits, and Slot save in your browser. Export JSON backups regularly, especially before moving devices, clearing browser storage, or importing data. Each tool uses its own compatible backup format. Importing replaces that tool's current data. Slot's backup controls are under **Settings → Backups & storage**.

Slot backups include task recurrence rules and occurrence history, permanent weekday availability, date overrides, kept times, rollover metadata, single-block preferences, checklists, and recurring commitments. Current standalone Slot and StudyBuddy backups are interchangeable. Older backups still load with no task recurrences or weekday rules; timed tasks keep their chunk settings, and checklist blocks default to a single-session preference.

## Offline use

The core tools, fonts, Markdown renderer, and math support are embedded. Spotify, streamed ambient sounds, and remote background URLs require internet. Focus timer settings, custom backgrounds, and ambient selections last for the current page session and reset after reloading. Spotify links persist unless you clear the player or turn off **Remember my Spotify link**.

---

You can download the individual apps from this repository as well, if you want to use them separately. 

Use **Hide** between **Cram** and **Add Cards** to check cards to exclude from Study, Cram, and spaced repetition, press **Enter** to finish, and restore cards individually by unchecking them in Hide mode or all at once with **Unhide All**.

## Validation

Run `node --test tests/*.test.cjs` for planner, lifecycle, automatic scheduling, multi-day rollover, recurrence/history, availability precedence, backup validation, and standalone/bundled parity checks. With Playwright and Chromium available, run `node tests/slot-ui.cjs`, `node tests/slot-task-ui.cjs`, and `node tests/slot-automation-ui.cjs` for browser coverage in both apps, including midnight rollover in America/Chicago and mobile layout. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a custom Chromium executable.
