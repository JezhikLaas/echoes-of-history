import { MODULE_ID } from "../constants";
import { writeWarn } from "../utils";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FolderEditDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    folder: any;

    constructor(folder: any, options: any = {}) {
        const isNew = options.isNew ?? false;
        options.window = {
            icon: isNew ? "fas fa-folder-plus" : "fas fa-cog"
        };
        super(options);
        this.folder = folder;    }

    static override DEFAULT_OPTIONS = {
        tag: "form",
        id: "folder-edit-dialog",
        classes: ["echoes-of-history-dialog"],
        position: { width: 400 },
        window: {
            icon: "fas fa-folder",
            title: "echoes-of-history.folders.edit-title"
        },
        form: {
            handler: FolderEditDialog.#onSubmit,
            closeOnSubmit: true
        }
    };

    static override PARTS = {
        form: {
            template: `modules/echoes-of-history/templates/folder-edit.hbs`
        }
    };

    override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];

        // Alle anderen Ordner für das Dropdown
        const otherFolders = allEntries
            .filter(e => e.type === "folder" && e.id !== this.folder.id)
            .map(f => ({ id: f.id, name: f.name }));

        return {
            folder: this.folder,
            folders: otherFolders,
            currentParentId: this.folder.parentId || ""
        };
    }

    static async #onSubmit(this: FolderEditDialog, _event: Event, _form: HTMLFormElement, formData: FormDataExtended) {
        const data = formData.object as { name: string, parentId: string };
        const folderId = (this as any).folder.id;

        const settings = game.settings as any;
        const allEntries = [...settings.get(MODULE_ID, "imageList")];

        const index = allEntries.findIndex(e => e.id === folderId);
        if (index > -1) {
            allEntries[index].name = data.name;
            allEntries[index].parentId = data.parentId || null;
        }
        else {
            const newFolder = {
                ...this.folder,
                name: data.name || "Neuer Ordner",
                parentId: data.parentId || null
            };
            allEntries.push(newFolder);
        }

        await settings.set(MODULE_ID, "imageList", allEntries);

        const sidebar = foundry.applications.instances.get(`${MODULE_ID}-tab`) as any;
        if (sidebar) {
            await sidebar.render();
        } else {
            writeWarn("Sidebar not found");
        }
    }
}