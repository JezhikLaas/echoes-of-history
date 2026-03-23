import { MODULE_ID } from "../constants";
import { VisionEntry } from "../settings";

interface VisionEditContext {
    entry: VisionEntry;
    defaultIn: number;
    defaultOut: number;
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class VisionEditDialog extends HandlebarsApplicationMixin(ApplicationV2)<VisionEditContext> {
    private entry: VisionEntry;
    private onSaveCallback: (updatedEntry: VisionEntry) => void;

    constructor(entry: VisionEntry, onSave: (e: VisionEntry) => void) {
        super();
        this.entry = { ...entry }; // Kopie, um "Abbrechen" zu ermöglichen
        this.onSaveCallback = onSave;
    }

    static override DEFAULT_OPTIONS = {
        tag: "form",
        id: "vision-edit-dialog",
        window: { title: "VISION-EDIT-DIALOG.Title", resizable: false },
        position: { width: 400 },
        actions: { save: VisionEditDialog.#onSave }
    };

    static override PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/vision-edit.hbs` }
    };

    protected override async _prepareContext(_options: any): Promise<VisionEditContext> {
        const settings = game.settings as any;
        return {
            entry: this.entry,
            // Fallback-Werte aus den globalen Settings anzeigen
            defaultIn: settings.get(MODULE_ID, "echoDefaultFadeIn"),
            defaultOut:settings.get(MODULE_ID, "echoDefaultFadeOut")
        };
    }

    static async #onSave(this: VisionEditDialog, event: Event, target: HTMLElement) {
        // Foundry's spezieller Form-Handler
        const form = this.element as HTMLFormElement;
        const FormDataExtended = (foundry.utils as any).FormDataExtended;
        const formData = new FormDataExtended(form);
        const data = formData.object; // Hier liegt dein fertiges Objekt!

        const updated = {
            ...this.entry,
            name: (data.name as string) || this.entry.name,
            fadeIn: Number(data.fadeIn),
            fadeOut: Number(data.fadeOut)
        };

        this.onSaveCallback(updated);
        await this.close();
    }
}