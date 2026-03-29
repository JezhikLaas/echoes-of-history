import { DataEntry } from "../settings";

interface VisionEditContext {
    entry: DataEntry;
    defaultIn: number;
    defaultOut: number;
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class EchoesBaseEditSheet<T extends DataEntry> extends HandlebarsApplicationMixin(ApplicationV2)<VisionEditContext> {
    protected readonly entry: T;
    protected readonly onSaveCallback: (updatedEntry: T) => void;

    constructor(entry: T, onSave: (e: T) => void) {
        super();
        this.entry = {...entry};
        this.onSaveCallback = onSave;
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

    protected getParametersFromForm(name: string): [any, { key: string, value: string }[]] {
        const form = this.element as HTMLFormElement;

        const formData = new FormData(form);
        const flatData = Object.fromEntries(formData.entries());
        const expanded = foundry.utils.expandObject(flatData) as any;

        let parameters = this.getArgsFromField(expanded, name);

        return [expanded, parameters];
    }

    protected getArgsFromField(expanded: any, fieldName: string): { key: string, value: string }[] {
        let args = expanded[fieldName]?.arguments || [];
        return Array.isArray(args) ? args : Object.values(args);
    }

    protected getFolderOptions(entries: any[]): { id: string, name: string }[] {
        const relevantFolders = entries
            .filter(e => e.type === "folder")
            .map(f => ({id: f.id, name: f.name, parent: f.parentId}));
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
}