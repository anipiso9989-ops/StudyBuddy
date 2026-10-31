# Tempo

A minimalist Pomodoro timer designed to create a calm, focused working environment.

Tempo combines structured work sessions, customizable visual environments, ambient sound, and optional Spotify playback in a single browser-based application.

Its guiding principle is simple: **One thing at a time.**

Rather than building another complex productivity dashboard, Tempo provides a dedicated space for sustained attention.

## Features

- **Pomodoro timer:** Alternate between focused work and scheduled breaks.
- **Custom durations:** Adjust work and break lengths independently.
- **Configurable cycles:** Choose how many work-break cycles to complete.
- **Playback controls:** Start, pause, resume, and reset sessions.
- **Progress tracking:** Display remaining time, current cycle, and phase progress.
- **Visual customization:** Use the default background, upload images, or provide image URLs.
- **Scene toggle:** Switch between photographic and plain backgrounds.
- **Ambient audio:** Play environmental sounds while working.
- **Spotify integration:** Embed supported Spotify content without developer credentials.
- **Responsive design:** Adapt the interface to different screen sizes.

## Getting Started

1. Download `Tempo.html`.
2. Open it in a modern web browser.
3. Configure your work duration, break duration, and cycle count in Settings.
4. Select **Start**.
5. Focus on your chosen task until the work interval ends.
6. Take the scheduled break and continue through the remaining cycles.

The default configuration is:

| Setting | Default |
|---|---|
| Work | 25 minutes |
| Break | 5 minutes |
| Cycles | 4 |

Each cycle includes both a work interval and a break.

The timer automatically transitions between phases and indicates when the complete session finishes.

## Timer Behavior

Tempo calculates remaining time using elapsed wall-clock time rather than simply subtracting one second on every interval.

This helps maintain accurate timing when browser rendering is delayed or the tab becomes inactive.

Sessions support pausing and resuming.

The Space key can start or pause the timer when focus is outside interactive controls.

Timer configuration is locked during an active or paused session. Reset the session to modify its settings.

## Custom Backgrounds

Tempo includes an embedded photographic background.

You can replace it with:

- An uploaded image.
- An animated GIF.
- A direct HTTP or HTTPS image URL.

Supported uploads include common browser image formats such as JPEG, PNG, WebP, GIF, AVIF, SVG, and BMP.

Background changes use a smooth crossfade. A dark overlay helps preserve text readability.

Custom backgrounds remain available during the current page session.

## Ambient Sound

Tempo provides six environmental recordings:

- Fireplace
- Rain
- River
- Thunderstorm
- Night crickets
- Morning birds

Sounds are streamed from Wikimedia Commons when requested.

Playback supports pausing, looping, volume adjustment, and turning sound off.

Recording attribution and licensing information appear within Settings.

Ambient audio requires network access.

## Spotify Integration

Paste a supported Spotify link to add music or spoken audio.

Tempo supports tracks, playlists, albums, artists, podcast episodes, and shows.

It uses Spotify's official embedded player, so no API keys, OAuth configuration, or Spotify developer account are required.

Playback availability depends on Spotify's restrictions and the user's environment.

The application can remember the selected Spotify link in browser storage. This preference can be disabled.

## Privacy and Technical Design

Tempo is implemented using HTML, CSS, and vanilla JavaScript.

Its interface and default background are embedded in the HTML file.

There is no dedicated backend or user account system.

Spotify links may be stored in `localStorage`. Timer state, custom backgrounds, and ambient playback are not permanently saved across reloads.

External audio, Spotify playback, and remote images require internet connectivity.

## Design Philosophy

Tempo removes visual clutter while retaining meaningful customization.

Its restrained typography, spacious composition, subtle transitions, and immersive background create a workspace centered on attention.

**The objective is not to measure every moment. It is to make focused work easier to begin and sustain.**
