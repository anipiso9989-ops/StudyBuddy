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

## Keyboard shortcuts

Use `Alt+1`, `Alt+2`, `Alt+3`, and `Alt+4` to switch to Flashcards, Habits, Focus, and Slot. During flashcard review, press Space to reveal an answer, then use Left or Right Arrow to grade it.

## Saving and backups

Flashcards, habits, and Slot save in your browser. Export JSON backups regularly, especially before moving devices, clearing browser storage, or importing data. Each tool uses its own compatible backup format. Importing replaces that tool's current data. Slot's backup controls are under **Settings → Backups & storage**.

## Offline use

The core tools, fonts, Markdown renderer, and math support are embedded. Spotify, streamed ambient sounds, and remote background URLs require internet. Focus timer settings, custom backgrounds, and ambient selections last for the current page session and reset after reloading. Spotify links persist unless you clear the player or turn off **Remember my Spotify link**.

---

StudyBuddy combines these four GitHub projects, also by me:

1. [Habits](https://github.com/anipiso9989-ops/habits)
2. [Tempo](https://github.com/anipiso9989-ops/tempo)
3. [Flashcards](https://github.com/anipiso9989-ops/flashcards)
4. [Slot](https://github.com/anipiso9989-ops/slot)

