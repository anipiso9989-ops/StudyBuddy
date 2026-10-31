# Slot

A local-first day and week planner that turns tasks, deadlines, and available hours into structured schedules.

Slot answers a practical question: **Where does everything fit?**

Describe timed tasks with their durations, or reserve a checklist block for a collection of to-dos without estimating each item. Slot searches for valid placements around your existing commitments.

The result is an actionable schedule built around real constraints.

## Features

- **Automatic scheduling:** Generate work blocks from tasks and available time.
- **Day and week views:** Plan individual dates or seven consecutive days.
- **Deadline awareness:** Schedule work before its specified deadline.
- **Task priorities:** Classify work as high, medium, or low priority.
- **Energy classification:** Distinguish deep work from lighter tasks.
- **Flexible task splitting:** Configure minimum and maximum work-block durations.
- **Checklist blocks:** Reserve one uninterrupted block with checkable to-dos and no per-item time estimates.
- **Recurring commitments:** Reserve fixed time on selected weekdays, every weekday, or every day; edit every property or delete the entire series.
- **Custom working hours:** Define multiple usable windows per day.
- **Progress tracking:** Complete or skip scheduled blocks.
- **Task management:** Edit every task setting or delete tasks directly from schedules, Week previews, Upcoming, Tasks, and skipped history; restore deleted work from Trash.
- **JSON backups:** Export and restore application data.

## Getting Started

1. Download `Slot.html`.
2. Open it in a modern browser.
3. Select the date you want to plan.
4. Add timed tasks or checklist blocks with a total duration and deadline.
5. Open **Settings** to configure available hours.
6. Add fixed commitments.
7. Click **Generate Schedule**.

Slot attempts to assign your work to available periods without overlapping fixed commitments or completed work.

The default usable window is 09:00–17:00.

## Creating Tasks

Timed tasks have a custom name; checklist blocks are automatically named **Checklist Block**. Both include an assigned date, total duration, deadline, priority, and energy classification.

Advanced options allow you to specify chunk limits.

For example:

| Property | Value |
|---|---|
| Name | Study algorithms |
| Duration | 120 minutes |
| Priority | High |
| Energy | Deep |
| Minimum chunk | 25 minutes |
| Maximum chunk | 60 minutes |
| Deadline | 17:00 |

Slot can split this work into several valid blocks rather than requiring one uninterrupted session.

Tasks can also be entered in bulk using comma-separated fields.

### Checklist Blocks

Choose **Checklist block** in the **Task type** menu. The task name field disappears and the block starts as **Checklist Block**. Choose its total duration and enter one to-do per line. The name field returns when you select **Timed task**. After creation, **Edit** lets you rename checklist blocks too. You can also create an empty block and add its items later. Individual items never require duration estimates. Timed tasks and checklist blocks can coexist on the same day.

The scheduler places a checklist block as one uninterrupted reservation around the same hours, deadlines, priorities, and commitments as normal tasks. Chunk settings apply to timed tasks only. If the block cannot fit, it remains visibly unslotted.

Check or uncheck items directly in **Your schedule** or **Tasks**. **Edit** lets you add, rename, remove, and check items, and edit the block's other properties. Checkmarks save immediately in the schedule and Tasks view; changes inside the edit dialog save with **Save changes**. They survive reloads, regeneration, skipping, pushing unfinished work to tomorrow, and Trash restoration.

Item progress and time progress are independent: checking the last item does not record the block's minutes as completed, and completing a block does not check its remaining items. Use the block's **Complete** control to record its scheduled time.

## Fixed and Recurring Commitments

Open **Settings → Fixed commitments → Add a commitment** and enter a name, Starts, and Ends. Leave **Repeat weekly** off for a one-off appointment.

For a recurring commitment, enable **Repeat weekly** and check the weekday tiles. **Weekdays** selects Monday through Friday; **Every day** selects all seven days. At least one day is required. Repetition starts on or after the Starts date and continues on the selected weekdays at the same local time and duration. For an overnight commitment, set Ends to the following date. Both sides of midnight are protected.

Recurring commitments appear in future day and week schedules automatically, without re-entry. All recurring rules remain visible in Settings even when they do not occur on the selected date.

Use **Edit** to change the name, start date and time, end date and time, repeat days, or whether it repeats. Changes apply to the whole series. Turn off repetition to convert a series to a one-off. **Delete series** removes the rule and all its occurrences entirely.

Commitments cannot overlap each other or completed work, including future recurring occurrences. Adding, editing, or deleting a commitment clears affected unfinished schedules across saved dates. Generate the day or week again to place work around the new commitments; completed history stays intact.

## Scheduling Engine

Slot uses a deterministic, bounded search algorithm.

It considers available windows, commitments, completed blocks, deadlines, priorities, and chunk constraints.

Higher-priority tasks are considered first, with deadlines breaking priority ties.

The scheduler searches for feasible placements. It does not claim to produce globally optimal schedules.

When a task cannot be placed, Slot reports a reason, such as insufficient capacity, incompatible chunk constraints, or a search limit.

Unscheduled work remains visible rather than disappearing.

Generating a week schedules seven days while preserving each task's assigned date.

## Managing Progress

Scheduled blocks can be marked completed or skipped.

Completed blocks remain part of the historical record and are protected from subsequent scheduling changes.

### Editing and Deleting Any Task

Use **Edit** or **Delete** beside a task in the day schedule, Week preview, Tasks list, Upcoming list, or skipped-block history. These controls work for timed tasks and checklist blocks, whether unscheduled, scheduled, skipped, partially completed, or completed. If a Week preview is shortened, **Open day** provides access to the rest of that day's tasks.

**Edit** opens the same dialog everywhere. Change the name, task type, assigned date, total duration, deadline, priority, energy, minimum/maximum chunks for timed tasks, or checklist items and their checkmarks. Checklist blocks always reserve one uninterrupted block, so their chunk limits follow their remaining duration. **Save changes** persists the edit while keeping your selected date and view; **Cancel** discards the draft. Upcoming tasks can be edited directly even when their date is outside the displayed week.

Renaming or editing checklist items keeps planned blocks. Changes to timing, type, priority, energy, or chunk limits clear affected unfinished schedules; generate the day or week again to apply them. Moving a task preserves completed and skipped history on its original dates.

Completed tasks can still be edited or deleted. Their recorded work keeps its original times and labels. Total duration cannot be reduced below completed minutes; increasing a completed task's duration reopens its remaining work. Use the existing Complete, Skip, and Restore controls to manage task progress.

**Delete** is also available inside the edit dialog. It removes unfinished scheduled blocks and moves the task to **Tasks → Trash**. **Restore task** returns it with its saved properties and checklist progress; completed history remains available throughout. Generate a schedule again to place restored unfinished work.

You can also push unfinished work to tomorrow or regenerate schedules after changing availability.

The dashboard displays scheduled minutes, usable minutes, daily utilization, and unslotted work.

## Storage and Privacy

Slot is a standalone HTML application with no runtime server requirement.

It stores tasks, schedules, commitments, and history in browser `localStorage`.

Exported JSON backups contain all dates, work history, checklist items and checkmarks, and recurring rules. Current standalone Slot and StudyBuddy backups are interchangeable. Existing saved data and older backups still load; existing commitments remain one-off until you choose repeat days.

Keep backups before clearing browser data, moving the HTML file, or switching devices.

## Design Philosophy

Slot emphasizes constraint-aware planning over decorative calendar management.

Its dark interface, clear typography, task controls, and compact timeline support deliberate daily execution.

**Planning is valuable only when the resulting schedule is realistic enough to execute.**

## Validation

Run `node --test tests/slot-core.test.cjs` from the repository root for planner, task lifecycle, backup, and bundled/standalone parity checks. With Playwright and Chromium available, run `node tests/slot-ui.cjs` and `node tests/slot-task-ui.cjs` to exercise both apps, including editing/deleting across views, completed history, restoration, persistence, and mobile layout. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for a custom Chromium executable.
