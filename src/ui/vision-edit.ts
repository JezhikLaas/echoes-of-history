import { MODULE_ID } from "../constants";
import {MacroWithPermission, VisionEntry} from "../settings";
import { warn } from "../utils/notifications";

interface VisionEditContext {
    entry: VisionEntry;
    defaultIn: number;
    defaultOut: number;
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class VisionEditDialog extends HandlebarsApplicationMixin(ApplicationV2)<VisionEditContext> {
    private readonly entry: VisionEntry;
    private readonly onSaveCallback: (updatedEntry: VisionEntry) => void;

    constructor(entry: VisionEntry, onSave: (e: VisionEntry) => void) {
        super();
        this.entry = { ...entry };
        this.onSaveCallback = onSave;
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

        const entry = this.entry as VisionEntry;
        if (!entry.fadeInExecute) {
            entry.fadeInExecute = { type: "none" };
        }
        if (!entry.fadeOutExecute) {
            entry.fadeOutExecute = { type: "none" };
        }

        return {
            entry: entry,
            defaultIn: settings.get(MODULE_ID, "echoFadeIn"),
            defaultOut: settings.get(MODULE_ID, "echoFadeOut"),
            folders: folders,
            allMacros: allMacros,
            currentParentId: entry.parentId || "",
            isFadeInNone: entry.fadeInExecute.type === "none",
            isFadeInInline: entry.fadeInExecute.type === "inline",
            isFadeInReference: entry.fadeInExecute.type === "reference",
            fadeInMacroArgs: entry.fadeInExecute.type === "reference" ? entry.fadeInExecute.arguments || [] : [],
            isFadeOutNone: entry.fadeOutExecute.type === "none",
            isFadeOutInline: entry.fadeOutExecute.type === "inline",
            isFadeOutReference: entry.fadeOutExecute.type === "reference",
            fadeOutMacroArgs: entry.fadeOutExecute.type === "reference" ? entry.fadeOutExecute.arguments || [] : []
        };
    }

    protected override async _onRender(context: any, options: any): Promise<void> {
        await super._onRender(context, options);
        const html = this.element;

        html.querySelectorAll('select[data-action="changeMacroType"]').forEach(select => {
            select.addEventListener("change", () => {
                const formData = new FormData(this.element as HTMLFormElement);
                const expanded = foundry.utils.expandObject(Object.fromEntries(formData.entries())) as any;

                Object.assign(this.entry, expanded);
                this.render();
            });
        });
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
            visible: formData.has("visible"),
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
        const entry = this.entry as any;

        entry.fadeInExecute = expanded.fadeInExecute || { type: "none" };

        entry.fadeInExecute.arguments = args;
        entry.fadeInExecute.arguments.push({ key: "", value: "" });

        this.render();
    }

    static async #onRemoveInArg(this: VisionEditDialog, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("fadeInExecute");

        const entry = this.entry as any;
        entry.fadeInExecute = expanded.fadeInExecute;
        entry.fadeInExecute.arguments = args;

        entry.fadeInExecute.arguments.splice(index, 1);

        this.render();
    }

    static async #onAddOutArg(this: VisionEditDialog, _event: Event, _target: HTMLElement) {
        const [expanded, args] = this.getParametersFromForm("fadeOutExecute");
        const entry = this.entry as any;

        entry.fadeOutExecute = expanded.fadeOutExecute || { type: "none" };

        entry.fadeOutExecute.arguments = args;
        entry.fadeOutExecute.arguments.push({ key: "", value: "" });

        this.render();
    }

    static async #onRemoveOutArg(this: VisionEditDialog, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("fadeOutExecute");

        const entry = this.entry as any;
        entry.fadeOutExecute = expanded.fadeOutExecute;
        entry.fadeOutExecute.arguments = args;

        entry.fadeOutExecute.arguments.splice(index, 1);

        this.render();
    }

    private getParametersFromForm(name: string): [any, { key: string, value: string }[]] {
        const form = this.element as HTMLFormElement;

        const formData = new FormData(form);
        const flatData = Object.fromEntries(formData.entries());
        const expanded = foundry.utils.expandObject(flatData) as any;

        let parameters = this.getArgsFromField(expanded, name);

        return [expanded, parameters];
    }

    private getArgsFromField(expanded: any, fieldName: string): { key: string, value: string }[] {
        let args = expanded[fieldName]?.arguments || [];
        return Array.isArray(args) ? args : Object.values(args);
    }

    private getFolderOptions(entries: any[]): { id: string, name: string }[] {
        const relevantFolders = entries
            .filter(e => e.type === "folder")
            .map(f => ({ id: f.id, name: f.name, parent: f.parentId }));
        const folderMap = new Map<string, { id: string, name: string, parent: string | null }>(
            relevantFolders.map(f => [f.id, f])
        );

        return relevantFolders.map(folder => {
            const path = [];
            let current: any = folder;

            while (current) {
                path.unshift(current.name);
                current = current.parent ? folderMap.get(current.parent) : null;
            }

            return {
                id: folder.id,
                name: path.join(" / ")
            };
        }).sort((a, b) => a.name.localeCompare(b.name, 'de'));
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