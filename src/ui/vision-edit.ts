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
        this.entry = { ...entry };
        this.onSaveCallback = onSave;
    }

    static override DEFAULT_OPTIONS = {
        tag: "form",
        id: "vision-edit-dialog",
        window: { title: "echoes-of-history.settings.vision-title", resizable: false },
        position: { width: 400 },
        actions: { save: VisionEditDialog.#onSave }
    };

    static override PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/vision-edit.hbs` }
    };

    protected override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];

        const folders = allEntries
            .filter(e => e.type === "folder")
            .map(f => ({ id: f.id, name: f.name }));

        return {
            entry: this.entry,
            defaultIn: settings.get(MODULE_ID, "echoFadeIn"),
            defaultOut: settings.get(MODULE_ID, "echoFadeOut"),
            folders: folders,
            currentParentId: (this.entry as any).parentId || ""
        };
    }

    static async #onSave(this: VisionEditDialog, _event: Event, _target: HTMLElement) {
        const form = this.element as HTMLFormElement;
        const formData = new FormData(form);
        const plainData = Object.fromEntries(formData.entries());
        const data = foundry.utils.expandObject(plainData)as Record<string, any>;

        const updated = {
            ...this.entry,
            name: (data.name as string) || this.entry.name,
            fadeIn: Number(data.fadeIn),
            fadeOut: Number(data.fadeOut),
            parentId: data.parentId || null
        };

        this.onSaveCallback(updated);
        await this.close();
    }
}