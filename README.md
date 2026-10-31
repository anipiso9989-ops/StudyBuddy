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

Plan a day or the next seven days. Add tasks with assigned dates, durations, deadlines, and priorities, then generate schedules around usable hours and fixed commitments. Open any day from the Week view, reuse hours across the week, and complete or skip work blocks. Tasks stay on their assigned dates; unfinished work can be pushed to tomorrow.

Use **Edit** or **Delete** directly on tasks in the day schedule, Week previews, Tasks, Upcoming, or skipped-block history. **Edit** opens every task setting: name, type, assigned date, duration, deadline, priority, energy, timed-task chunk limits, and checklist contents/checkmarks. Upcoming tasks can be edited without opening their date; saving keeps your selected date and view. Timing changes clear affected unfinished schedules, so generate again afterward. Completed tasks remain editable and deletable; recorded work stays in history, and duration cannot fall below completed minutes. Increasing a completed task's duration reopens it. **Delete**, also available inside the editor, moves the task to **Tasks → Trash** for restoration.

Choose **Checklist block** under **Task type** to reserve one uninterrupted block for small tasks whose individual durations are unknown. The block starts as **Checklist Block**, with no name field to fill in during creation; **Edit** can rename it later. Set the block's total duration and enter one to-do per line; no per-item estimates are needed. Check items directly in the schedule or Tasks view, and use **Edit** to add, rename, remove, or check items. Checkmarks save independently of completing the time block and survive reloads, regeneration, and moving unfinished work.

Under **Settings → Fixed commitments**, enable **Repeat weekly** and check the weekday tiles, or choose **Weekdays** or **Every day**. The commitment repeats from its Starts date at the same local time and duration, including overnight commitments. Recurring commitments remain available in Settings on every date. **Edit** changes the name, start date/time, end date/time, and repeat days for the whole series; **Delete series** removes it entirely. Turn off repetition to make it a one-off. Regenerate schedules after commitment changes; completed work remains protected.

## Keyboard shortcuts

Use `Alt+1`, `Alt+2`, `Alt+3`, and `Alt+4` to switch to Flashcards, Habits, Focus, and Slot. During flashcard review in Study or Cram, press Space or use **Show Answer / Show Front** to flip between the front and back as often as needed. With the answer visible, use Left or Right Arrow to grade it.

## Saving and backups

Flashcards, habits, and Slot save in your browser. Export JSON backups regularly, especially before moving devices, clearing browser storage, or importing data. Each tool uses its own compatible backup format. Importing replaces that tool's current data. Slot's backup controls are under **Settings → Backups & storage**.

Slot backups include checklist items, checkmarks, and recurring commitments and work between the current standalone Slot and StudyBuddy apps. Existing backups and saved one-off commitments still load.

## Offline use

The core tools, fonts, Markdown renderer, and math support are embedded. Spotify, streamed ambient sounds, and remote background URLs require internet. Focus timer settings, custom backgrounds, and ambient selections last for the current page session and reset after reloading. Spotify links persist unless you clear the player or turn off **Remember my Spotify link**.

---

You can download the individual apps from this repository as well, if you want to use them separately. 

Use **Hide** between **Cram** and **Add Cards** to check cards to exclude from Study, Cram, and spaced repetition, press **Enter** to finish, and restore cards individually by unchecking them in Hide mode or all at once with **Unhide All**.

## Validation

Run `node --test tests/slot-core.test.cjs` for planner, task editing/deletion, backup, and standalone/bundled parity checks. With Playwright and Chromium available, run `node tests/slot-ui.cjs` for checklist, recurrence, backup, and mobile browser checks, and `node tests/slot-task-ui.cjs` for task editing/deletion across views in both apps. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if using a custom Chromium executable.
