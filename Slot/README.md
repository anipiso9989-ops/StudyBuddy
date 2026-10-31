# Slot

A local-first day and week planner that turns tasks, deadlines, and available hours into structured schedules.

Slot answers a practical question: **Where does everything fit?**

Instead of manually arranging every task on a calendar, you describe what needs to be done, how long it takes, and when it must be finished. Slot searches for valid placements around your existing commitments.

The result is an actionable schedule built around real constraints.

## Features

- **Automatic scheduling:** Generate work blocks from tasks and available time.
- **Day and week views:** Plan individual dates or seven consecutive days.
- **Deadline awareness:** Schedule work before its specified deadline.
- **Task priorities:** Classify work as high, medium, or low priority.
- **Energy classification:** Distinguish deep work from lighter tasks.
- **Flexible task splitting:** Configure minimum and maximum work-block durations.
- **Fixed commitments:** Reserve time for meetings, appointments, and other obligations.
- **Custom working hours:** Define multiple usable windows per day.
- **Progress tracking:** Complete or skip scheduled blocks.
- **Task management:** Edit, delete, restore, and reschedule work.
- **JSON backups:** Export and restore application data.

## Getting Started

1. Download `Slot.html`.
2. Open it in a modern browser.
3. Select the date you want to plan.
4. Add tasks with their durations and deadlines.
5. Open **Settings** to configure available hours.
6. Add fixed commitments.
7. Click **Generate Schedule**.

Slot attempts to assign your work to available periods without overlapping fixed commitments or completed work.

The default usable window is 09:00–17:00.

## Creating Tasks

Every task includes a name, assigned date, duration, deadline, priority, and energy classification.

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

You can push unfinished work to tomorrow, edit tasks, or regenerate schedules after changing availability.

Deleted tasks move into Trash and can be restored.

The dashboard displays scheduled minutes, usable minutes, daily utilization, and unslotted work.

## Storage and Privacy

Slot is a standalone HTML application with no runtime server requirement.

It stores tasks, schedules, commitments, and history in browser `localStorage`.

Exported JSON backups contain all dates and work history.

Keep backups before clearing browser data, moving the HTML file, or switching devices.

## Design Philosophy

Slot emphasizes constraint-aware planning over decorative calendar management.

Its dark interface, clear typography, task controls, and compact timeline support deliberate daily execution.

**Planning is valuable only when the resulting schedule is realistic enough to execute.**
