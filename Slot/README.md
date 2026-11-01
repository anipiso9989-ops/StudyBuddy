# Slot

A local-first day and week planner that keeps tasks, deadlines, and available time in a current schedule.

## Getting started

1. Download `Slot.html` and open it in a modern browser.
2. Set available hours and fixed commitments in **Settings**.
3. Add timed tasks or checklist blocks with a duration and deadline.
4. Follow the automatically updated Day or Week schedule.

No installation, account, server, or Generate button is required. The default usable window is 09:00–17:00. All times and day boundaries use the browser's local time zone.

## Automatic scheduling

Saving a task, deadline, priority, duration, commitment, or availability change automatically recalculates schedules. Adding, deleting, restoring, completing, or skipping work also updates the plan. The selected date and view stay in place during edits. Skipped intervals stay clear during automatic retries. **Refresh day** is optional; routine planning needs no manual trigger.

Ordinary tasks keep their assigned date. Higher priorities are considered first, with deadlines breaking priority ties. The deterministic scheduler respects available windows, fixed commitments, completed work, kept times, deadlines, and chunk constraints. It searches for verified placements within a bounded search budget and reports insufficient capacity, incompatible chunks, or uncertainty rather than hiding unscheduled work. It does not claim globally optimal schedules.

### Keeping manual placements

Choose **Adjust / keep time** on an unfinished block. Set a different start time or save its current one; the duration stays unchanged. The scheduler reserves that placement and schedules other work around it. Choose **Release time** to return it to automatic placement.

A new manual placement must be within available hours and clear of commitments, completed work, and other kept blocks. If a later availability, commitment, or deadline change creates a conflict, the kept block stays in place with a warning. Adjust or release it to resolve the conflict. Release a task's kept times before changing its date, duration, type, or chunk limits. Deleting or skipping a task intentionally removes its unfinished placements.

## Unfinished-task rollover

At a new local day, unfinished work from earlier dates moves into the next feasible available periods. This includes uncompleted or skipped work; completed and deleted tasks do not roll forward. Remaining work can span several dates and uses existing chunk rules. Assigned work and kept times reserve capacity first.

Original deadlines never change during rollover. Slot reserves available chunks before the deadline, then places excess work in the earliest remaining periods and flags it with a deadline warning. Work for which no placement can be verified remains visibly unslotted. Checklist checkmarks, completed minutes, and historical block times/labels survive.

Rollover checks every 30 seconds while the page runs and catches up on reopening, window focus, visibility changes, or returning to Slot in StudyBuddy. If you were viewing Today when midnight passed, the view advances to the new day. A closed HTML file cannot execute background work; the next opening performs catch-up. Repeated checks do not duplicate task instances or completion history.

Catch-up searches up to 90 days and can schedule partial remaining work while flagging the rest. Multi-day rollover uses a bounded chronological chunk search; it does not promise the fewest sessions across all days.

## Creating and managing tasks

Timed tasks have a custom name. Checklist blocks start as **Checklist Block** and can be renamed in the editor. Both support an assigned date, duration, local deadline, priority, energy classification, and chunk preferences. Bulk entry accepts one comma-separated task per line, with quoted names when necessary and optional minimum/maximum chunks.

Use **Edit** or **Delete** in Day, Week previews, Tasks, Upcoming, or skipped history. The editor exposes every task setting and checklist contents/checkmarks. Saving updates the schedule immediately; Cancel discards the draft. Editing an individual recurring occurrence creates an exception that later series edits preserve.

Completed tasks remain editable and deletable. Their completed blocks retain their original times and labels. Duration cannot fall below completed minutes; increasing it reopens remaining work. **Delete** moves a task to **Tasks → Trash**, removing unfinished blocks while keeping completed history. **Restore task** brings it back and schedules its unfinished work automatically. Restoring old unfinished work also invokes rollover when necessary.

### Single block

**Single block · On/Off** requests an uninterrupted session without requiring manual chunk arithmetic. It starts off for timed tasks and on for checklist blocks. With it on, the scheduler tries one session first and then searches for the fewest sessions it can verify for the assigned day. Notifications report splits and unplaced work. With it off, manual minimum/maximum chunks apply.

Adding a one-off task with Single block on checks feasibility before saving and immediately applies a verified plan. If no reliable placement is found, the task is not added, its draft remains, and saved data and IDs stay intact. Existing tasks and recurring instances that cannot fit remain visible with reasons. Completed minutes are protected, and preferences apply to the remaining work.

### Checklist blocks

Choose **Checklist block**, set its total duration, and enter one to-do per line. Individual items need no duration estimate. Check items directly in Day or Tasks; use **Edit** to add, remove, rename, or check them.

Sessions of the same task share checkmarks. Each recurring occurrence receives its own unchecked copy of the list. Item progress and completed time are independent: checking the last item does not record minutes, and completing a work block does not check remaining items. Checkmarks persist through reloads, automatic planning, rollover, and Trash restoration.

## Recurring tasks

Enable **Repeat task weekly** when adding a timed task or checklist block. Select individual weekdays, **Weekdays**, or **Every day**. For example, enter mathematics, 45 minutes, and Monday through Friday once.

The assigned date anchors the series. Each occurrence receives the same duration, priority, energy, chunk preferences, and checklist template. Its deadline uses the same local time and calendar-day offset from its occurrence date as the original task. Deadlines must be after the occurrence's start and within 366 days. Date arithmetic uses calendar days rather than fixed elapsed hours, including daylight-saving transitions.

Slot materializes a rolling 35-day horizon plus any selected future week. Opening later extends the horizon and catches up ungenerated active days since the previous horizon; occurrence identities prevent duplicates. Future instances are generated even if they cannot fit, so capacity problems stay visible. Limits are 100 series, 100 ordinary unfinished tasks per date, and 20,000 total tasks. A limit or storage failure leaves the previous saved state intact.

Under **Tasks → Recurring tasks**:

- **Edit recurring task** changes the task template, start date, deadline, weekdays, or paused state.
- **Pause** withdraws untouched occurrences from today onward and stops generation.
- **Resume** restarts from today, without backfilling deliberately paused days.

Changes apply to untouched occurrences from today onward. Completed instances, recorded/skipped work, checked items, individually edited occurrences, kept times, and deleted instances remain intact. Pausing retains those existing exceptions and their history. Historical occurrences are never rewritten. Deleting one occurrence affects only that occurrence; pause the rule to stop future work.

## Permanent weekday availability

Open **Settings → Weekday availability**, choose weekdays, and add usable windows. Save once for permanent rules—for example, Monday through Friday, 18:00–20:00. An empty window list is a permanent day off. **Edit hours** loads a rule for editing; **Reset to default** removes it and restores the default 09:00–17:00 fallback.

**Usable hours** remains available for date-specific exceptions. **Use these hours for all 7 days** saves seven explicit date overrides. **Use weekday rule** removes the selected date's override.

Availability precedence is:

| Source | When it applies |
|---|---|
| Date-specific hours, including an empty day-off override | The exact date has an override |
| Permanent weekday rule | No date override exists and that weekday has a rule |
| Default 09:00–17:00 | Neither exists |

Multiple windows allow split days; end time may be 24:00. Changes automatically update schedules while keeping completed work and manual placements.

## Fixed and recurring commitments

Under **Settings → Fixed commitments → Add a commitment**, enter Name, Starts, and Ends. Leave **Repeat weekly** off for a one-off appointment, or enable it and choose weekday tiles, **Weekdays**, or **Every day**.

Repetition begins on or after Starts and preserves local start time and duration. Set Ends to the next date for overnight commitments; both sides of midnight are protected. Rules remain manageable in Settings even on off-days. **Edit** changes the entire series; turning repetition off converts it to a one-off. **Delete series** removes the rule and its occurrences.

Commitments cannot overlap each other or completed work, including future recurring occurrences. Changes automatically place unfinished work around the updated commitments. Kept times remain fixed and show conflicts when necessary.

## Storage and backups

The standalone app has no runtime server requirement and saves in browser `localStorage`. Keep using the same browser profile and file location. Export backups regularly before moving devices, clearing storage, or importing another backup.

**Settings → Backups & storage** exports JSON containing all tasks, recurrence rules and occurrence identities, completion/checklist history, commitments, permanent weekday hours, date overrides, manual placements, rollover metadata, and ID sequences. Current Slot and StudyBuddy backups are interchangeable. Older backups load with empty task recurrence and weekday-rule collections; older task preferences and one-off commitments remain compatible.

Import validates records, references, chronology, overlaps, and progress before replacing saved data. Intentional manual-placement conflicts are retained so they can be resolved in the UI. Writes use a browser storage lock where available and an optimistic check to prevent stale-tab overwrites. Storage failures leave the prior saved data intact. Other tabs refresh after successful saves.

## Validation

From the repository root, run:

```sh
node --test tests/*.test.cjs
```

This covers the planner, task lifecycle, automatic scheduling, multi-day rollover, deadlines, preserved manual times, recurrence editing/pause/history, availability precedence, backup migration/corruption, and parity between standalone Slot and StudyBuddy's bundled Slot.

With Playwright and Chromium available, run:

```sh
node tests/slot-ui.cjs
node tests/slot-task-ui.cjs
node tests/slot-automation-ui.cjs
```

Browser checks exercise both apps, existing task/checklist/commitment controls, automatic updates, recurring tasks, kept-time conflicts, weekday rules, exports, reloads, simulated midnight rollover in America/Chicago, and mobile layout. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a custom Chromium executable and `SLOT_TEST_SCREENSHOTS` for optional screenshots.
