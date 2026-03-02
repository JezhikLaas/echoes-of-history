
# Echoes of History

> *„What happened last…"*

A cinematic **recap slideshow** module for [Foundry VTT](https://foundryvtt.com/) (v13+).

Perfect for groups that play every few weeks and need a quick, atmospheric refresher at the start of each session — like the "Previously on…" opening of a TV series.

---

## Features

- **Fullscreen overlay slideshow** with fade-in/fade-out transitions
- **Multiple slides** parsed from a single text block — just separate paragraphs with a blank line
- **Built-in editor** accessible from Module Settings (GM only)
- **Configurable slide duration**
- **Loop mode** — slides cycle endlessly until dismissed with a click
- **API** for use in Active Tiles, Macros, or the browser console
- Works with **any game system**

---

## Installation

### Via Manifest URL (recommended)

1. In Foundry VTT, go to **Setup → Add-on Modules → Install Module**
2. Paste the following URL into the **Manifest URL** field:
 
[https://github.com/JezhikLaas/echoes-of-history/releases/latest/download/module.json](https://github.com/JezhikLaas/echoes-of-history/releases/latest/download/module.json)
## Usage

To use Echoes of History, follow these steps:

1. Install the module via the Manifest URL.
2. Configure the module settings to your liking.
3. Use the module's API to trigger slides from Active Tiles, Macros, or the browser console.
4. Enjoy the cinematic recap slideshow at the start of each session!

## Configuration example

### Open settings and enter some text:
```
Line 1

Line 2
Line 3

Line 4
```

This creates **3 slides**. Line breaks within a paragraph are preserved.

### From a Macro (Active Tiles to the rescue!):
``js game.RECAP_ECHOES.recap.start();``

## API Reference

All methods are available via `game.RECAP_ECHOES.recap`:

| Method | Description |
|---|---|
| `start()` | Start the looping slideshow (fade in overlay, then cycle through slides) |
| `stop()` | Stop the slideshow and fade out the overlay |
| `show()` | Show a single slide (no autoplay) |
| `setSections(string[])` | Set slide contents programmatically (saves to world settings) |
