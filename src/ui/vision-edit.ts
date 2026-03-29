import {MODULE_ID} from "../constants";
import {MacroWithPermission, VisionEntry} from "../settings";
import {warn} from "../utils/notifications";
import {EchoesBaseEditSheet} from "./echoes-base-edit-sheet";

export class VisionEditDialog extends EchoesBaseEditSheet<VisionEntry> {
    constructor(entry: VisionEntry, onSave: (e: VisionEntry) => void) {
        super(entry, onSave);
    }

    static override DEFAULT_OPTIONS = {
        tag: "form",
        id: "vision-edit-dialog",
        window: { title: "echoes-of-history.settings.vision-title", resizable: false },
        position: { width: 700 },
        actions: {
            save: VisionEditDialog.#onSave,
            addInArg: VisionEditDialog.#onAddInArg,
            removeInArg: VisionEditDialog.#onRemoveInArg,
            addOutArg: VisionEditDialog.#onAddOutArg,
            removeOutArg: VisionEditDialog.#onRemoveOutArg
        }
    };

    static override PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/vision-edit.hbs` }
    };

    protected override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const allEntries = (settings.get(MODULE_ID, "imageList") as any[]) || [];

        const folders = this.getFolderOptions(allEntries);
        const allMacros = ((game.macros?.contents || []) as any as MacroWithPermission[])
            .filter(m => m.canExecute)
            .map(m => ({ id: m.id, name: m.name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'de'));

        if (!this.entry.fadeInExecute) {
            this.entry.fadeInExecute = { type: "none" };
        }
        if (!this.entry.fadeOutExecute) {
            this.entry.fadeOutExecute = { type: "none" };
        }

        return {
            entry: this.entry,
            defaultIn: settings.get(MODULE_ID, "echoFadeIn"),
            defaultOut: settings.get(MODULE_ID, "echoFadeOut"),
            folders: folders,
            allMacros: allMacros,
            currentParentId: this.entry.parentId || "",
            isFadeInNone: this.entry.fadeInExecute.type === "none",
            isFadeInInline: this.entry.fadeInExecute.type === "inline",
            isFadeInReference: this.entry.fadeInExecute.type === "reference",
            fadeInMacroArgs: this.entry.fadeInExecute.type === "reference" ? this.entry.fadeInExecute.arguments || [] : [],
            isFadeOutNone: this.entry.fadeOutExecute.type === "none",
            isFadeOutInline: this.entry.fadeOutExecute.type === "inline",
            isFadeOutReference: this.entry.fadeOutExecute.type === "reference",
            fadeOutMacroArgs: this.entry.fadeOutExecute.type === "reference" ? this.entry.fadeOutExecute.arguments || [] : []
        };
    }

    static async #onSave(this: VisionEditDialog, _event: Event, _target: HTMLElement) {
        const form = this.element as HTMLFormElement;
        const formData = new FormData(form);
        const plainData = Object.fromEntries(formData.entries());
        const data = foundry.utils.expandObject(plainData) as any;

        const updated = {
            ...this.entry,
            name: data.name || this.entry.name,
            fadeIn: Number(data.fadeIn),
            fadeOut: Number(data.fadeOut),
            parentId: data.parentId || null,
            fadeInExecute: data.fadeInExecute,
            fadeOutExecute: data.fadeOutExecute
        };

        if (updated.fadeInExecute?.arguments && !Array.isArray(updated.fadeInExecute.arguments)) {
            updated.fadeInExecute.arguments = Object.values(updated.fadeInExecute.arguments);
        }
        if (updated.fadeOutExecute?.arguments && !Array.isArray(updated.fadeOutExecute.arguments)) {
            updated.fadeOutExecute.arguments = Object.values(updated.fadeOutExecute.arguments);
        }

        if (updated.fadeInExecute?.type === "reference" && !updated.fadeInExecute.arguments) {
            updated.fadeInExecute.arguments = [];
        }
        if (updated.fadeOutExecute?.type === "reference" && !updated.fadeOutExecute.arguments) {
            updated.fadeOutExecute.arguments = [];
        }

        const validation = this.validate(data);
        if (!validation.valid) {
            validation.errors.forEach(error => warn(error));
            return;
        }

        this.onSaveCallback(updated);
        await this.close();
    }

    static async #onAddInArg(this: VisionEditDialog, _event: Event, _target: HTMLElement) {
        const [expanded, args] = this.getParametersFromForm("fadeInExecute");
        this.entry.fadeInExecute = expanded.fadeInExecute || { type: "none" };

        if (this.entry.fadeInExecute.type == "reference") {
            this.entry.fadeInExecute.arguments = args;
            this.entry.fadeInExecute.arguments.push({key: "", value: ""});
        }
        this.render();
    }

    static async #onRemoveInArg(this: VisionEditDialog, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("fadeInExecute");
        this.entry.fadeInExecute = expanded.fadeInExecute;

        if (this.entry.fadeInExecute.type == "reference") {
            this.entry.fadeInExecute.arguments = args;
            this.entry.fadeInExecute.arguments.splice(index, 1);
        }
        this.render();
    }

    static async #onAddOutArg(this: VisionEditDialog, _event: Event, _target: HTMLElement) {
        const [expanded, args] = this.getParametersFromForm("fadeOutExecute");
        this.entry.fadeOutExecute = expanded.fadeOutExecute || { type: "none" };

        if (this.entry.fadeOutExecute.type == "reference") {
            this.entry.fadeOutExecute.arguments = args;
            this.entry.fadeOutExecute.arguments.push({key: "", value: ""});
        }
        this.render();
    }

    static async #onRemoveOutArg(this: VisionEditDialog, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("fadeOutExecute");
        this.entry.fadeOutExecute = expanded.fadeOutExecute;

        if (this.entry.fadeOutExecute.type == "reference") {
            this.entry.fadeOutExecute.arguments = args;
            this.entry.fadeOutExecute.arguments.splice(index, 1);
        }

        this.render();
    }

    private validate(data: VisionEntry): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.name || data.name.trim() === "") {
            errors.push(game.i18n?.localize("echoes-of-history.validation.name-required") || "name required");
        }
        if (data.type == "vision" && (isNaN(data.fadeIn) || data.fadeIn < 0)) {
            errors.push(game.i18n?.localize("echoes-of-history.validation.fade-in-positive") || "fade in positive");
        }
        if (data.type == "vision" && (isNaN(data.fadeOut) || data.fadeOut < 0)) {
            errors.push(game.i18n?.localize("echoes-of-history.validation.fade-out-positive") || "fade out positive");
        }
        if (data.fadeInExecute?.type === "inline") {
            if (!data.fadeInExecute.macroCode || data.fadeInExecute.macroCode.trim() === "") {
                errors.push(game.i18n?.localize("echoes-of-history.validation.script-required") || "script required");
            }
        }
        if (data.fadeInExecute?.type === "reference") {
            if (!data.fadeInExecute.macroId) {
                errors.push(game.i18n?.localize("echoes-of-history.validation.macro-required") || "macro required");
            }
            if (Array.isArray(data.fadeInExecute.arguments)) {
                const hasEmptyKeys = data.fadeInExecute.arguments.some((arg: any) => !arg.key || arg.key.trim() === "");
                if (hasEmptyKeys) {
                    errors.push(game.i18n?.localize("echoes-of-history.validation.keys-required") || "keys required");
                }
            }
        }
        if (data.fadeOutExecute?.type === "inline") {
            if (!data.fadeOutExecute.macroCode || data.fadeOutExecute.macroCode.trim() === "") {
                errors.push(game.i18n?.localize("echoes-of-history.validation.script-required") || "script required");
            }
        }
        if (data.fadeOutExecute?.type === "reference") {
            if (!data.fadeOutExecute.macroId) {
                errors.push(game.i18n?.localize("echoes-of-history.validation.macro-required") || "macro required");
            }
            if (Array.isArray(data.fadeOutExecute.arguments)) {
                const hasEmptyKeys = data.fadeOutExecute.arguments.some((arg: any) => !arg.key || arg.key.trim() === "");
                if (hasEmptyKeys) {
                    errors.push(game.i18n?.localize("echoes-of-history.validation.keys-required") || "keys required");
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

