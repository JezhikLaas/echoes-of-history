import { MODULE_ID } from "./constants";
import { RecapEditor } from "./ui/recap-editor";

export function registerSettings(): void {
    const settings = game.settings as any;
    const i18n = game.i18n;
    const keybindings = game.keybindings;

    if (!settings || !i18n || !keybindings) {
        console.warn(`[${MODULE_ID}] Foundry game API not ready.`);
        return;
    }

    settings.register(MODULE_ID, "recapSections", {
        name: "Recap: Abschnitte (intern)",
        hint: "Wird über den Editor verwaltet.",
        scope: "world",
        config: false,
        type: String,
        default: "[]"
    });

    settings.registerMenu(MODULE_ID, "recapEditor", {
        name: "Recap: Abschnitte bearbeiten",
        hint: "Öffnet einen Editor für die Recap-Texte.",
        label: "Editor öffnen",
        icon: "fas fa-scroll",
        type: RecapEditor as any,
        restricted: true
    });

    settings.register(MODULE_ID, "recapSlideMs", {
        name: "Recap: Slide-Dauer (ms)",
        hint: "Wie lange jeder Slide angezeigt wird (z.B. 6000).",
        scope: "world",
        config: true,
        type: Number,
        default: 6000
    });

    settings.register(MODULE_ID, "repeatPauseMs", {
        name: "Recap: Repeat-Pause (ms)",
        hint: "Wie lange vor der Wiederholung gewartet wird (z.B. 10000).",
        scope: "world",
        config: true,
        type: Number,
        default: 10000
    });
}