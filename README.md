# Echoes of History

> *„What happened last… and what is happening now.“*

A cinematic **storytelling and atmosphere** module for [Foundry VTT](https://foundryvtt.com/) (v13+).

Designed to bridge the distance in remote play with pure immersion, whether through atmospheric recaps, high-impact "Visions", or the new interactive **Theatre of Mimes**.

------
## 🕊️ Transparency & Integrity
Noble be man, helpful and good.

This module is a product of modern engineering and radical honesty. As a backend developer, my strength lies in the logic, the architecture, and the "gears" behind the curtain. However, to bring the visual magic of this module to life, I collaborated with AI (Gemini & Claude) to polish the CSS and other UI elements.

Why is this not on the official Marketplace?
In March 2026, Foundry VTT introduced strict guidelines regarding AI-assisted development for official listings. Rather than obscuring the collaborative nature of this project to fit those rules, I have chosen transparency over visibility.

Every line of code has been reviewed, understood, and refined by me to ensure it meets the highest standards of stability and immersion. This module exists outside the official directory because its creator values integrity more than a marketplace badge.

## 🌟 Features

### 🎬 Cinematic Recap

- **Fullscreen overlay slideshow** with smooth transitions.
- **Multiple slides** parsed from a single text block.
- **Loop mode** — slides cycle endlessly until dismissed.

### 🌌 Cinematic Visions

- **Dedicated Sidebar Tab:** Manage your cinematic assets (images) with ease.
- **Deep Folder Structure:** Organize chapters or locations with nested folders.
- **Persistence (F5-Safe):** Visions automatically restore after a refresh.
- **Event-Driven Macros:** Trigger custom logic on Fade-In and Fade-Out.

### 🎭 The Theatre (New!)

Bring your NPCs and heroes to the spotlight with a dedicated ensemble overlay.

- **Ensemble Display:** Show up to 10 "Mimes" simultaneously over any Vision or Map.
- **Dynamic Spotlight:** Focus on the active speaker with a "noble" glow and scaling effect.
- **Visibility Toggle:** Prepare actors in the background and reveal them only when the drama peaks.
- **Drag & Drop Recruitment:** Effortlessly pull characters from the *World & Campaign Builder* directly onto the stage.
- **Regiepult Integration:** A dedicated control panel in your sidebar to manage the show and close the curtain.

------

## 🧪 Automation & Macros

The heart of the system is the **Automation Hook**. Every Vision and Mime can trigger actions at specific points: **On Enter** and **On Exit**.

### The "Scope" Variable

When a macro is triggered, it receives a `scope` object containing context-aware data:

| **Variable**   | **Description**                               |
| -------------- | --------------------------------------------- |
| `scope.name`   | The name of the current Vision or Mime.       |
| `scope.fadeIn` | The configured fade-in duration (in ms).      |
| `scope.anyKey` | Custom parameters defined in the Edit Dialog. |

------

## 🛠 Usage

### 1. Managing the Theatre

Click the **Theatre Icon** in the sidebar.

- **Stage Actors:** Click the "Mime" icon next to an entry to add them to the current ensemble.
- **Spotlight:** Click a Mime's portrait on the stage to highlight them.
- **Visibility:** Toggle the "eye" icon to hide or reveal actors during a live scene.
- **Curtain Call:** Use the **"Vorhang zu"** (Close Stage) button in the sidebar footer to end the conversation for everyone.

### 2. Broadcasting

- **Visions:** Click a Vision in the sidebar to broadcast it.
- **Closing:** GMs can click the background or the sidebar button to trigger the **Fade-Out Macro** for all clients.

------

## 📡 Technical Architecture

- **Socket-Synced:** Real-time synchronization between GM and players via a robust Dispatcher.
- **Layered Immersion:** Strict Z-Index management ensures that the Theatre always sits perfectly above your Visions and below the UI.

------
*Remember!*

**Noble be man, helpful and good.**

Use this module to create moments your players will remember, no matter how many kilometers lie between your tables.