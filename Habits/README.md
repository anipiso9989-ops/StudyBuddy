# Habits

A lightweight habit tracker designed to make consistency visible.

Habits helps you build routines by recording daily completions and tracking consecutive-day streaks. There are no accounts, complicated goals, or unnecessary productivity features. Just the habits you want to maintain and a simple way to measure whether you're showing up.

The application runs entirely in your browser and stores your progress locally.

## Features

- **Habit creation:** Add habits with custom names.
- **Daily completion:** Mark habits complete with one click.
- **Streak tracking:** Monitor consecutive days of successful completion.
- **Undo functionality:** Reverse today's completion if marked accidentally.
- **Habit editing:** Rename existing habits without losing their history.
- **Habit deletion:** Remove habits that are no longer relevant.
- **Automatic persistence:** Save changes to browser storage.
- **JSON backups:** Export and import your habit data.
- **Responsive interface:** Works on desktop and mobile screens.

## Getting Started

No installation, account, or external service is required.

1. Download `Habits.html`.
2. Open the file in a modern browser.
3. Enter a habit name in the input field.
4. Click **Add** or press Enter.
5. Mark the habit complete when you finish it.

Your habits appear in a simple list showing their names, current streaks, and available actions.

Example habits include:

- Read for 30 minutes
- Exercise
- Practice programming
- Study mathematics
- Write 500 words

You can track as many habits as your browser storage permits.

## How Streaks Work

Each habit maintains a record of completion dates.

When you mark a habit complete, the current local calendar date is added to its history.

The application calculates streaks by counting consecutive completed dates.

For example:

| Day | Completed | Streak |
|---|---|---|
| Monday | Yes | 1 |
| Tuesday | Yes | 2 |
| Wednesday | Yes | 3 |
| Thursday | No | 3 |
| Friday | Yes | 1 |

An unfinished current day does not immediately break the displayed streak. The calculation begins from yesterday when today's completion is missing.

A missed previous day breaks the streak.

Each habit can be completed once per calendar day.

## Data Storage

Habits uses the browser's `localStorage` API.

Each habit contains:

- A unique numeric identifier.
- Its name.
- Its creation date.
- An array of completed dates.

Dates use the `YYYY-MM-DD` format.

All information is stored locally. The application does not require authentication or transmit habit records to a server.

Data is specific to the browser profile and storage context where the application runs.

## Backup and Recovery

Select **Export JSON** to download your complete habit collection.

Exported files follow this naming convention:

    habits-YYYY-MM-DD.json

Select **Import JSON** to restore a previously exported collection.

Imports are validated before application. Invalid records are rejected, and existing data is preserved.

A successful import replaces the current habit collection after confirmation.

The interface also displays storage and backup status, including warnings when browser storage is unavailable.

## Design

Habits uses a monochrome, terminal-inspired visual language.

Its interface includes a subtle grid background, monospace typography, outlined controls, and clear completion states.

The application deliberately avoids elaborate charts, achievements, notifications, and social features.

This keeps attention on the underlying behavior rather than the tracking system itself.

## Limitations

Habits currently supports daily, binary completion only.

It does not provide reminders, scheduled frequencies, historical calendar editing, cloud synchronization, or automatic cross-device backups.

**The principle is simple: define the behavior, perform it daily, and let consistency accumulate.**
