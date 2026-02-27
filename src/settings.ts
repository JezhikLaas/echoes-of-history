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

    // --- Recap: Daten-Setting (nicht im UI sichtbar, intern JSON) ---

    settings.register(MODULE_ID, "recapSections", {
        name: "Recap: Abschnitte (intern)",
        hint: "Wird über den Editor verwaltet.",
        scope: "world",
        config: false,
        type: String,
        default: "[]"
    });

    // --- Recap: Editor-Button ---

    settings.registerMenu(MODULE_ID, "recapEditor", {
        name: "Recap: Abschnitte bearbeiten",
        hint: "Öffnet einen Editor für die Recap-Texte.",
        label: "Editor öffnen",
        icon: "fas fa-scroll",
        type: RecapEditor as any,
        restricted: true
    });

    // --- Recap: Slide-Dauer ---

    settings.register(MODULE_ID, "recapSlideMs", {
        name: "Recap: Slide-Dauer (ms)",
        hint: "Wie lange jeder Slide angezeigt wird (z.B. 6000).",
        scope: "world",
        config: true,
        type: Number,
        default: 6000
    });
}