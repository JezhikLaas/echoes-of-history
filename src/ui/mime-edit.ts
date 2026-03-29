import { EchoesBaseEditSheet } from "./echoes-base-edit-sheet";
import { MacroWithPermission, MimeEntry } from "../settings";
import { MODULE_ID } from "../constants";
import { warn } from "../utils/notifications";

export class MimeEdit extends EchoesBaseEditSheet<MimeEntry> {
    constructor(entry: MimeEntry, onSave: (e: MimeEntry) => void) {
        super(entry, onSave);
    }

    static override DEFAULT_OPTIONS = {
        tag: "form",
        id: "mime-edit-dialog",
        window: {title: "echoes-of-history.settings.mime-title", resizable: false},
        position: {width: 700},
        actions: {
            save: MimeEdit.#onSave,
            addInArg: MimeEdit.#onAddInArg,
            removeInArg: MimeEdit.#onRemoveInArg,
            addOutArg: MimeEdit.#onAddOutArg,
            removeOutArg: MimeEdit.#onRemoveOutArg
        }
    };

    static override PARTS = {
        form: {template: `modules/${MODULE_ID}/templates/mime-edit.hbs`}
    };

    protected override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const allEntries = (settings.get(MODULE_ID, "imageList") as any[]) || [];

        const folders = this.getFolderOptions(allEntries);
        const allMacros = ((game.macros?.contents || []) as any as MacroWithPermission[])
            .filter(m => m.canExecute)
            .map(m => ({id: m.id, name: m.name}))
            .sort((a, b) => a.name.localeCompare(b.name, 'de'));

        if (!this.entry.onEnterExecute) {
            this.entry.onEnterExecute = {type: "none"};
        }
        if (!this.entry.onExitExecute) {
            this.entry.onExitExecute = {type: "none"};
        }

        return {
            entry: this.entry,
            folders: folders,
            allMacros: allMacros,
            currentParentId: this.entry.parentId || "",
            isonEnterNone: this.entry.onEnterExecute.type === "none",
            isonEnterInline: this.entry.onEnterExecute.type === "inline",
            isonEnterReference: this.entry.onEnterExecute.type === "reference",
            onEnterMacroArgs: this.entry.onEnterExecute.type === "reference" ? this.entry.onEnterExecute.arguments || [] : [],
            isonExitNone: this.entry.onExitExecute.type === "none",
            isonExitInline: this.entry.onExitExecute.type === "inline",
            isonExitReference: this.entry.onExitExecute.type === "reference",
            onExitMacroArgs: this.entry.onExitExecute.type === "reference" ? this.entry.onExitExecute.arguments || [] : []
        };
    }

    static async #onSave(this: MimeEdit, _event: Event, _target: HTMLElement) {
        const form = this.element as HTMLFormElement;
        const formData = new FormData(form);
        const plainData = Object.fromEntries(formData.entries());
        const data = foundry.utils.expandObject(plainData) as any;

        const updated = {
            ...this.entry,
            name: data.name || this.entry.name,
            shortName: data.shortName,
            onEnter: Number(data.onEnter),
            onExit: Number(data.onExit),
            parentId: data.parentId || null,
            visible: formData.has("visible"),
            onEnterExecute: data.onEnterExecute,
            onExitExecute: data.onExitExecute
        };

        if (updated.onEnterExecute?.arguments && !Array.isArray(updated.onEnterExecute.arguments)) {
            updated.onEnterExecute.arguments = Object.values(updated.onEnterExecute.arguments);
        }
        if (updated.onExitExecute?.arguments && !Array.isArray(updated.onExitExecute.arguments)) {
            updated.onExitExecute.arguments = Object.values(updated.onExitExecute.arguments);
        }

        if (updated.onEnterExecute?.type === "reference" && !updated.onEnterExecute.arguments) {
            updated.onEnterExecute.arguments = [];
        }
        if (updated.onExitExecute?.type === "reference" && !updated.onExitExecute.arguments) {
            updated.onExitExecute.arguments = [];
        }

        const validation = this.validate(data);
        if (!validation.valid) {
            validation.errors.forEach(error => warn(error));
            return;
        }

        this.onSaveCallback(updated);
        await this.close();
    }

    static async #onAddInArg(this: MimeEdit, _event: Event, _target: HTMLElement) {
        const [expanded, args] = this.getParametersFromForm("onEnterExecute");
        this.entry.onEnterExecute = expanded.onEnterExecute || {type: "none"};

        if (this.entry.onEnterExecute.type == "reference") {
            this.entry.onEnterExecute.arguments = args;
            this.entry.onEnterExecute.arguments.push({key: "", value: ""});
        }
        this.render();
    }

    static async #onRemoveInArg(this: MimeEdit, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("onEnterExecute");
        this.entry.onEnterExecute = expanded.onEnterExecute;

        if (this.entry.onEnterExecute.type == "reference") {
            this.entry.onEnterExecute.arguments = args;
            this.entry.onEnterExecute.arguments.splice(index, 1);
        }
        this.render();
    }

    static async #onAddOutArg(this: MimeEdit, _event: Event, _target: HTMLElement) {
        const [expanded, args] = this.getParametersFromForm("onExitExecute");
        this.entry.onExitExecute = expanded.onExitExecute || {type: "none"};

        if (this.entry.onExitExecute.type == "reference") {
            this.entry.onExitExecute.arguments = args;
            this.entry.onExitExecute.arguments.push({key: "", value: ""});
        }
        this.render();
    }

    static async #onRemoveOutArg(this: MimeEdit, _event: Event, target: HTMLElement) {
        const index = parseInt(target.dataset.index ?? "");
        if (isNaN(index)) return;

        let [expanded, args] = this.getParametersFromForm("onExitExecute");
        this.entry.onExitExecute = expanded.onExitExecute;

        if (this.entry.onExitExecute.type == "reference") {
            this.entry.onExitExecute.arguments = args;
            this.entry.onExitExecute.arguments.splice(index, 1);
        }

        this.render();
    }

    private validate(data: MimeEntry): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.name || data.name.trim() === "") {
            errors.push(game.i18n?.localize("echoes-of-history.validation.name-required") || "name required");
        }
        if (data.onEnterExecute?.type === "inline") {
            if (!data.onEnterExecute.macroCode || data.onEnterExecute.macroCode.trim() === "") {
                errors.push(game.i18n?.localize("echoes-of-history.validation.script-required") || "script required");
            }
        }
        if (data.onEnterExecute?.type === "reference") {
            if (!data.onEnterExecute.macroId) {
                errors.push(game.i18n?.localize("echoes-of-history.validation.macro-required") || "macro required");
            }
            if (Array.isArray(data.onEnterExecute.arguments)) {
                const hasEmptyKeys = data.onEnterExecute.arguments.some((arg: any) => !arg.key || arg.key.trim() === "");
                if (hasEmptyKeys) {
                    errors.push(game.i18n?.localize("echoes-of-history.validation.keys-required") || "keys required");
                }
            }
        }
        if (data.onExitExecute?.type === "inline") {
            if (!data.onExitExecute.macroCode || data.onExitExecute.macroCode.trim() === "") {
                errors.push(game.i18n?.localize("echoes-of-history.validation.script-required") || "script required");
            }
        }
        if (data.onExitExecute?.type === "reference") {
            if (!data.onExitExecute.macroId) {
                errors.push(game.i18n?.localize("echoes-of-history.validation.macro-required") || "macro required");
            }
            if (Array.isArray(data.onExitExecute.arguments)) {
                const hasEmptyKeys = data.onExitExecute.arguments.some((arg: any) => !arg.key || arg.key.trim() === "");
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