import { MODULE_ID } from "./constants";
import { RecapEditor } from "./ui/recap-editor";
import { writeWarn } from "./utils";

export function registerSettings(): void {
    const settings = game.settings as any;
    const i18n = game.i18n;
    const keybindings = game.keybindings;

    if (!settings || !i18n || !keybindings) {
        writeWarn("Foundry game API not ready.");
        return;
    }

    const prefix = "echoes-of-history.settings";

    settings.register(MODULE_ID, "recapSections", {
        name: "Recap: Abschnitte (intern)",
        hint: "Wird über den Editor verwaltet.",
        scope: "world",
        config: false,
        type: String,
        default: "[]"
    });

    settings.registerMenu(MODULE_ID, "recapEditor", {
        name: `${prefix}.recap-editor-name`,
        hint: `${prefix}.recap-editor-hint`,
        label: "Editor öffnen",
        icon: "fas fa-scroll",
        type: RecapEditor as any,
        restricted: true
    });

    settings.register(MODULE_ID, "recapSlideMs", {
        name: `${prefix}.recap-slidems-name`,
        hint: `${prefix}.recap-slidems-hint`,
        scope: "world",
        config: true,
        type: Number,
        default: 6000
    });

    settings.register(MODULE_ID, "repeatPauseMs", {
        name: `${prefix}.recap-pausems-name`,
        hint: `${prefix}.recap-pausems-hint`,
        scope: "world",
        config: true,
        type: Number,
        default: 10000
    });

    settings.register(MODULE_ID, "echoFadeIn", {
        name: `${prefix}.fade-in-name`,
        hint: `${prefix}.fade-in-hint`,
        scope: "world",
        config: true,
        type: Number,
        default: 3000
    });

    settings.register(MODULE_ID, "echoFadeOut", {
        name: `${prefix}.fade-out-name`,
        hint: `${prefix}.fade-out-hint`,
        scope: "world",
        config: true,
        type: Number,
        default: 2000
    });
}

export interface MacroEntryNone {
    type: "none";
}

export interface MacroEntryInline {
    type: "inline";
    macroCode: string;
}

export interface MacroEntryReference {
    type: "reference";
    macroId: string;
    arguments: { key: string, value: string }[];
}

export type MacroEntry = MacroEntryNone | MacroEntryInline | MacroEntryReference;

export interface VisionEntry {
    type: "vision";
    id: string;
    path: string;
    name: string;
    fadeIn: number;
    fadeOut: number;
    parentId: string | null;
    fadeInExecute: MacroEntry;
    fadeOutExecute: MacroEntry;
}

export interface FolderEntry {
    type: "folder";
    id: string;
    name: string;
    parentId: string | null;
    expanded: boolean;
}

export type SidebarEntry = FolderEntry | VisionEntry;