# Echoes of History

> *„What happened last… and what is happening now.“*

A cinematic **storytelling and atmosphere** module for [Foundry VTT](https://foundryvtt.com/) (v13+).

Perfect for groups that play remotely and need a quick, atmospheric refresher at the start of each session — or high-impact visual "Visions" during play to bridge the physical distance with pure immersion.

---

## 🌟 Features

### Cinematic Recap
- **Fullscreen overlay slideshow** with smooth transitions.
- **Multiple slides** parsed from a single text block.
- **Loop mode** — slides cycle endlessly until dismissed.

### Cinematic Visions (New!)
- **Dedicated Sidebar Tab:** A new image icon in your sidebar to manage cinematic assets (images).
- **Deep Folder Structure:** Organize these assets into chapters or locations with nested folders.
- **Persistence (F5-Safe):** If the GM or a player refreshes their browser, the active Vision is automatically restored.
- **Event-Driven Macros:** Trigger custom logic exactly when a Vision fades in or out.

---

## 🎭 Automation & Macros

The heart of the Vision system is the **Automation Hook**. Every Vision can trigger actions at two specific points: **On Fade-In** and **On Fade-Out**.

### The "Scope" Variable
When a macro is triggered, it receives a `scope` object containing context-aware data. Use these variables to synchronize music or send targeted whispers:

| Variable | Description |
|---|---|
| `scope.name` | The name of the current Vision. |
| `scope.fadeIn` | The configured fade-in duration (in ms). |
| `scope.fadeOut` | The configured fade-out duration (in ms). |
| `scope.anyKey` | Any custom parameters defined in the Vision Edit Dialog. |

**Example Inline Macro:**
```javascript
// Start a playlist and whisper to a specific player
const player = game.users.getName("The Rogue");
if (player) {
    ChatMessage.create({ 
        content: "You feel a cold breeze from the north...", 
        whisper: [player.id] 
    });
}

const playlist = game.playlists.getName("Atmosphere");
playlist?.playAll();
```

## 🛠 Usage

### 1. Managing Visions

Click the **Image Icon** in the sidebar.

- **Create Folders** to organize scenes.
- **Add Visions:** Provide an image path and a name.
- **Edit Details:** Click the pencil icon to configure fade times and macros.

### 2. Broadcasting

- **Show:** Click a Vision in the sidebar to broadcast it to all players.
- **Hide:** Simply click the active overlay on the screen. The GM's click triggers the **Fade-Out Macro** for all clients.

------

## API Reference

### Text Recap System

Available via `game.RECAP_ECHOES.recap`:

| **Method**              | **Description**                         |
| ----------------------- | --------------------------------------- |
| `start()`               | Start the looping text slideshow.       |
| `stop()`                | Stop the slideshow and fade out.        |
| `show()`                | Show a single text slide (no autoplay). |
| `setSections(string[])` | Set slide contents programmatically.    |

