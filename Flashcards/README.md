# Flashcards

A minimalist, browser-based flashcard application built for active recall, spaced repetition, and efficient studying. Create decks, review material, and track what needs attention without accounts, subscriptions, or complicated setup.

Flashcards combines a terminal-inspired interface with a straightforward review system. Its purpose is simple: spend less time managing study materials and more time remembering them.

## Features

- **Spaced repetition:** Automatically schedules reviews based on whether you remember each answer.
- **Unlimited deck creation:** Organize flashcards into separate subjects, courses, or topics.
- **Bulk card entry:** Create multiple flashcards simultaneously using a simple text format.
- **Study mode:** Review cards that are currently due.
- **Cram mode:** Review every card in a deck without changing its schedule.
- **Rich content:** Supports Markdown formatting and KaTeX mathematical expressions.
- **Keyboard shortcuts:** Navigate study sessions without relying entirely on the mouse.
- **Local storage:** Saves decks and review progress using IndexedDB.
- **JSON backups:** Export and restore your flashcard collections.

## Getting Started

No installation, build process, or backend is required.

1. Download `Flashcards.html`.
2. Open the file in a modern web browser.
3. Select **New Deck**.
4. Enter a deck name and your flashcards.
5. Create the deck and begin studying.

The application is contained in one HTML file. Markdown, sanitization, mathematical rendering, and the web font use external CDN resources.

## Creating Flashcards

Cards use a simple delimiter:

    Question::Answer

For example:

    Capital of France?::Paris
    What is photosynthesis?::Converting light into chemical energy
    Derivative of $x^2$::$2x$

Enter one card per line. The application validates entries and identifies malformed lines before saving.

Within a deck, cards can be individually edited or deleted. Decks can also be renamed, expanded, exported, or removed.

## How Spaced Repetition Works

Flashcards uses a fixed interval progression:

**1 → 3 → 7 → 14 → 30 → 60 → 120 days**

During a study session:

- **Know:** Advances the card to its next review interval.
- **Don't Know:** Resets its progression and schedules another review five minutes later.

Missed cards are also returned to the current session's queue.

New cards are immediately available for review. Once no cards remain due, the session is complete.

This is a deliberately simple scheduling algorithm, not an implementation of FSRS or Anki's scheduling system.

## Keyboard Controls

| Key | Action |
|---|---|
| Space | Reveal or hide an answer |
| Left Arrow | Mark as Don't Know |
| Right Arrow | Mark as Know or advance in Cram mode |
| Escape | Exit the study session |

Arrow-key grading becomes available after revealing the answer.

## Data and Privacy

All study data remains in the browser's IndexedDB database. No account, cloud synchronization, or external application server is involved in saving progress.

Export JSON backups regularly, especially before clearing browser data or changing devices.

Importing a backup replaces the existing collection after confirmation. Individual decks can also be exported as JSON.

## Design Philosophy

Flashcards prioritizes recall over decoration.

Its monochrome interface, monospace typography, responsive layout, and restrained controls reduce distractions. The application emphasizes the information being studied rather than dashboards, animations, or gamification.

**The goal is not to make studying complicated. It is to make consistent, effective review easier.**
