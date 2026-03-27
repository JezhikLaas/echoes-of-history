import { MODULE_ID } from "../constants";
import { writeError, writeLog, writeWarn } from "../utils/logging";
import { VisionEditDialog } from "./vision-edit";
import { FolderEntry, MimeEntry } from "../settings";
import { FolderEditDialog } from "./folder-edit";
import { VisionManager } from "../vision-manager";
import { TheatreStage } from "./theatre-stage";
import { warn } from "../utils/notifications";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImagesSidebar extends HandlebarsApplicationMixin(ApplicationV2) {
    private readonly dragDrop: DragDrop[];

    constructor(options = { }) {
        super(options);
        this.dragDrop = this.createDragDropHandlers();
    }

    static override DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-tab`,
        tag: "section",
        classes: ["echoes-of-history-app-shell"],
        window: {
            frame: false
        },
        dragDrop: [{
            dropSelector: ".echoes-of-history-sidebar, .folder-item"
        }],
        actions: {
            addImage: ImagesSidebar.#onAddImage,
            showImage: ImagesSidebar.#onShowImage,
            deleteEntry: ImagesSidebar.#onDeleteEntry,
            editEntry: ImagesSidebar.#onEditEntry,
            toggleFolder: ImagesSidebar.#onToggleFolder,
            addFolder: ImagesSidebar.#onAddFolder,
            editFolder: ImagesSidebar.#onEditFolder,
            deleteFolder: ImagesSidebar.#onDeleteFolder,
            startTheatre: ImagesSidebar.#onStartTheatre,
            createMime: ImagesSidebar.#onCreateMime,
            closeStage: ImagesSidebar.#onCloseStage,
            switchVisible: ImagesSidebar.#onSwitchVisible,
        }
    };

    static override PARTS: any = {
        main: {
            template: `modules/${MODULE_ID}/templates/images-sidebar.hbs`,
            templates: [
                `modules/${MODULE_ID}/templates/directory-item.hbs`
            ]
        }
    };

    private createDragDropHandlers(): DragDrop[] {
        const dragDropOptions = (this.options as any).dragDrop || [];
        return dragDropOptions.map((d : any) => {
            d.permissions = {
                drop: this.canDragDrop.bind(this),
            };
            d.callbacks = {
                dragover: this.onDragOver.bind(this),
                drop: this.onDrop.bind(this),
            };
            return new foundry.applications.ux.DragDrop(d);
        });
    }

    private canDragDrop(_info: string): boolean {
        return !TheatreStage.isActive;
    }

    private onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    private async onDrop(event: DragEvent): Promise<void> {
        const target = event.target as HTMLElement;

        const folderItem = target.closest(".folder-item") as HTMLElement | null;
        let folderId: string | null = null;
        if (folderItem) {
            folderId = folderItem.dataset.id || null;
        }

        const sidebar = target.closest(".echoes-of-history-sidebar");
        if (!sidebar) {
            writeWarn("Unable to determine target");
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const raw = event.dataTransfer?.getData("text/plain");
        if (!raw) return;

        let data: any;
        try {
            data = JSON.parse(raw);
        } catch {
            writeError("Unable to parse dropped object from Json");
            return;
        }

        if (data.type !== "JournalEntry" || !data.fcbData) return;

        if (data.fcbData.topic !== 1 && data.fcbData.topic !== 4) {
            warn("echoes-of-history.sidebar.invalid_type", {
                name: data.fcbData.name
            });

            return;
        }

        const uuid = data.uuid ?? data.fcbData?.childId;
        if (!uuid) {
            writeWarn("Unable to extract uuid", data);
            return;
        }

        let img = "icons/svg/mystery-man.svg";
        try {
            const doc = await (fromUuid as any)(uuid);
            const page = doc?.pages?.contents?.[0];
            if (page?.system?.img) {
                img = page.system.img;
            }
        } catch {
            writeWarn("Failed to fetch image for participant", uuid);
        }

        const entry: MimeEntry = {
            type: "mime",
            id: uuid,
            name: data.fcbData.name ?? "Unbekannt",
            path: img,
            visible: true,
            onEnterExecute: { type: "none" },
            onExitExecute: { type: "none" },
            parentId: folderId
        };

        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];
        allEntries.push(entry);
        await settings.set(MODULE_ID, "imageList", allEntries);

        await this.render({ force: true });
    }

    protected override async _onRender(context: any, options: any): Promise<void> {
        await super._onRender(context, options);

        if (this.dragDrop && this.element) {
            this.dragDrop.forEach((handler) => {
                handler.bind(this.element);
            });
        }
    }

    public static async registerPartials() {
        const partials = {
            "directoryItem": `modules/${MODULE_ID}/templates/directory-item.hbs`
        };

        for (const [name, path] of Object.entries(partials)) {
            const response = await fetch(path);
            const content = await response.text();
            Handlebars.registerPartial(name, content);
        }

        console.log("Echoes | Partials erfolgreich für Handlebars registriert.");
    }

    static async #onAddImage(this: ImagesSidebar, _event: PointerEvent, _target: HTMLElement) {
        const picker = new (foundry.applications.apps as any).FilePicker({
            type: "image",
            callback: (path: string) => this._addImage(path)
        });
        picker.render(true);
    }

    static #onShowImage(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const id = ImagesSidebar.getIdForEvent(target, ".image-item");
        if (id) this.broadcastShow(id);
    }

    static async #onDeleteEntry(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const id = ImagesSidebar.getIdForEvent(target);
        if (id) {
            const confirm = await (foundry.applications.api as any).DialogV2.confirm({
                window: { title: game.i18n?.localize("echoes-of-history.sidebar.delete-title") },
                content: `<p>${game.i18n?.localize("echoes-of-history.sidebar.delete-text")}</p>`,
                rejectClose: false,
                modal: true
            });
            if (confirm) {
                await this._deleteImage(id);
            }
        }
        else {
            writeWarn("ID to delete not found");
        }
    }

    static async #onDeleteFolder(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".folder-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (id) {
            const confirm = await (foundry.applications.api as any).DialogV2.confirm({
                window: { title: game.i18n?.localize("echoes-of-history.folders.delete-title") },
                content: `<p>${game.i18n?.localize("echoes-of-history.folders.delete-text")}</p>`,
                rejectClose: false,
                modal: true
            });
            if (confirm) {
                const settings = game.settings as any;
                const allEntries = settings.get(MODULE_ID, "imageList");
                const entryToDelete = allEntries.find((e: { id: string; }) => e.id === id);

                allEntries.forEach((e: { parentId: null; }) => {
                    if (e.parentId === entryToDelete.id) {
                        e.parentId = null;
                    }
                });
                await this._deleteImage(id);
            }
        }
        else {
            writeWarn("ID to delete not found");
        }
    }

    static async #onEditEntry(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const id = ImagesSidebar.getIdForEvent(target);
        if (!id) {
            writeError("Unable to locate id to edit, exiting");
            return;
        }

        const settings = game.settings as any;
        const allImages = settings.get(MODULE_ID, "imageList") as any[];
        const imageData = allImages.find(img => img.id === id);

        if (!imageData) {
            writeError("Image entry not found in settings list, exiting");
            return;
        }

        const dialog = new VisionEditDialog(imageData, async (updatedEntry) => {
            const index = allImages.findIndex(img => img.id === id);
            if (index > -1) {
                allImages[index] = updatedEntry;
                await settings.set(MODULE_ID, "imageList", allImages);
                await this.render();
            }
            else {
                writeError("Image entry vanished during edit, not updating anything");
            }
        });
        await dialog.render({ force: true });
    }

    static async #onToggleFolder(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".folder-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (!id) return;

        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[];

        const index = allEntries.findIndex(e => e.id === id);
        if (index > -1) {
            allEntries[index].expanded = !allEntries[index].expanded;

            await settings.set(MODULE_ID, "imageList", allEntries);
            await this.render();
        }
    }

    static async #onAddFolder(this: ImagesSidebar, _event: PointerEvent, _target: HTMLElement) {
        const newFolder: FolderEntry = {
            type: "folder",
            id: foundry.utils.randomID(),
            name: game.i18n?.localize("echoes-of-history.folders.new-folder") ?? "New Folder",
            parentId: null,
            expanded: true
        };

        await new FolderEditDialog(newFolder, { isNew: true }).render({ force: true });
    }

    static async #onStartTheatre(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".folder-item") as HTMLElement | null;
        const folderId = row?.dataset.id;
        if (!folderId) return;
        const allEntries = (game.settings as any).get(MODULE_ID, "imageList") as any[] || [];
        const ensemble = allEntries.filter(e =>
            e.type === "mime" && e.parentId === folderId
        );

        if (ensemble.length === 0) {
            warn("echoes-of-history.folders.no-mimes");
            return;
        }
        writeLog(`Starting conversation with ${ensemble.length} mimes.`);

        TheatreStage.startConversation(ensemble);
        await this.render();
    }

    static async #onCreateMime(this: ImagesSidebar, _event: PointerEvent, _target: HTMLElement) {
        await new FilePicker({
            type: "image",
            displayMode: "tiles",
            callback: async (path: string) => {
                const filename = path.split("/").pop()?.split(".")[0] || "New Mime";

                const newMime: MimeEntry = {
                    type: "mime",
                    id: foundry.utils.randomID(),
                    path: path,
                    name: filename,
                    parentId: null,
                    visible: true,
                    onEnterExecute: { type: "none" }, // Noble "None"-Default
                    onExitExecute: { type: "none" }
                };

                const settings = game.settings as any;
                const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];
                allEntries.push(newMime);
                await settings.set(MODULE_ID, "imageList", allEntries);

                await this.render({ force: true });
            }
        }).browse();
    }

    static async #onSwitchVisible(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const id = ImagesSidebar.getIdForEvent(target, ".mime-item");
        const allEntries = (game.settings as any).get(MODULE_ID, "imageList");
        const mime = allEntries.find((e: { id: string; }) => e.id === id) as MimeEntry;

        if (!mime) {
            writeWarn("Unable to locate mime, exiting")
            return;
        }

        mime.visible = !mime.visible;
        const settings = game.settings as any;
        await settings.set(MODULE_ID, "imageList", allEntries);

        await this.render();
        if (TheatreStage.isActive) {
            TheatreStage.updateMimeVisibility(id!, mime.visible);
        }
    }

    static async #onEditFolder(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".folder-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (!id) return;

        const allEntries = (game.settings as any).get(MODULE_ID, "imageList");
        const folder = allEntries.find((e: { id: string; }) => e.id === id);

        if (folder) {
            await new FolderEditDialog(folder).render({force: true});
        }
    }

    static async #onCloseStage(this: TheatreStage, _event: PointerEvent, _target: HTMLElement) {
        if ((ui as any).theatreStage) {
            await TheatreStage.closeConversation((ui as any).theatreStage);
            await this.render();
        }
    }

    getData() {
        const settings = game.settings as any;
        const storedImages = settings.get(MODULE_ID, "imageList") as any[];
        return {
            images: storedImages
        };
    }

    get _onActivate() {
        return () => {
            const container = document.getElementById("echoes-of-history-sidebar");
            container?.classList.add("active");

            return this.render({
                force: true
            });
        };
    }

    get _onDeactivate() {
        return () => {
            const container = document.getElementById("echoes-of-history-sidebar");
            if (container) {
                container.classList.remove("active");
            }
        };
    }

    protected override _doEvent(
        handler: (...args: any[]) => any,
        options: { eventName?: string; hookName?: string } = {}
    ): any {
        const { eventName } = options;

        if (eventName === "activate" || eventName === "deactivate") {
            if (typeof handler === "function") {
                handler.call(this);
            }
            return;
        }

        return super._doEvent(handler as (...args: any[]) => void, options as any);
    }

    protected override _insertElement(element: HTMLElement): void {
        const container = document.getElementById("echoes-of-history-sidebar");
        if (container) {
            container.replaceChildren(element);
        }
        super._insertElement(element);
    }

    override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];

        const sanitizedEntries = allEntries.map(e => ({
            ...e,
            type: e.type || "vision",
            parentId: e.parentId || null,
        }));

        const buildTree = (parentId: string | null = null): any[] => {
            return sanitizedEntries
                .filter(e => e.parentId === parentId)
                .sort((a, b) => a.type.localeCompare(b.type))
                .map(e => {
                    if (e.type === "folder") {
                        const children = buildTree(e.id);
                        const hasMimes = children.some(child => child.type === "mime");
                        return {
                            ...e,
                            children: children,
                            hasMimes: hasMimes
                        };
                    }
                    return e;
                });        };

        return {
            tree: buildTree(null),
            isTheatreActive: TheatreStage.isActive
        };
    }

    private static getIdForEvent(target: HTMLElement, selector: string = ".image-item, .mime-item"): string | undefined {
        const row = target.closest(selector) as HTMLElement | null;
        return row?.dataset.id;
    }

    private async _addImage(path: string) {
        const settings = game.settings as any;
        const currentList = settings?.get(MODULE_ID, "imageList") as any[];
        const name = path.split('/').pop()?.replace(/\.[^/.]+$/, "") || game.i18n?.format("echoes-of-history.sidebar.new_image");
        const newVision = {
            id: foundry.utils.randomID(),
            path: path,
            name: name,
            fadeIn: settings.get(MODULE_ID, "echoFadeIn"),
            fadeOut: settings.get(MODULE_ID, "echoFadeOut")
        };

        await settings.set(MODULE_ID, "imageList", [...currentList, newVision]);
        await this.render({ force: true });
    }

    private async _deleteImage(id: string) {
        const settings = game.settings as any;
        const currentList = settings.get(MODULE_ID, "imageList") as any[];
        const newList = currentList.filter(img => img.id !== id);

        await settings.set(MODULE_ID, "imageList", newList);
        await this.render({ force: true });
    }

    broadcastShow(id: string) {
        writeLog(`Broadcasting image show: ${id}`);
        VisionManager.showVision(id);
    }
}