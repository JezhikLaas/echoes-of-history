import { MODULE_ID, SOCKET_NAME } from "../constants";
import { writeError, writeLog } from "../utils";
import { VisionEditDialog } from "./vision-edit";
import {VisionEntry} from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ImagesSidebar extends HandlebarsApplicationMixin(ApplicationV2) {
    static override DEFAULT_OPTIONS = {
        id: `{${MODULE_ID}-tab`,
        tag: "section",
        classes: ["echoes-of-history-app-shell"],
        window: {
            frame: false
        },
        actions: {
            addImage: ImagesSidebar.#onAddImage,
            showImage: ImagesSidebar.#onShowImage,
            deleteImage: ImagesSidebar.#onDeleteImage,
            editEcho: ImagesSidebar.#onEditVision
        }
    };

    static override PARTS: any = {
        main: {
            template: `modules/${MODULE_ID}/templates/images-sidebar.hbs`
        }
    };

    static async #onAddImage(this: ImagesSidebar, _event: PointerEvent, _target: HTMLElement) {
        const picker = new (foundry.applications.apps as any).FilePicker({
            type: "image",
            callback: (path: string) => this._addImage(path)
        });
        picker.render(true);
    }

    static #onShowImage(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".image-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (id) this.broadcastShow(id);
    }

    static async #onDeleteImage(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const row = target.closest(".image-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (id) {
            const confirm = await (foundry.applications.api as any).DialogV2.confirm({
                window: { title: game.i18n?.localize("echoes-of-history.sidebar.delete-title") },
                content: `<p>${game.i18n?.localize("echoes-of-history.sidebar.delete-text")}</p>`,
                rejectClose: false,
                modal: true
            });
            if (confirm) {
                await this._deleteImage(id); // Wir übergeben die ID statt des Index
            }
        }
    }

    static async #onEditVision(this: ImagesSidebar, _event: PointerEvent, target: HTMLElement) {
        const settings = game.settings as any;
        const row = target.closest(".image-item") as HTMLElement | null;
        const id = row?.dataset.id;
        if (!id) {
            writeError("Unable to locate id to edit, exiting");
            return;
        }

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
        dialog.render({ force: true });
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
        const storedImages = settings?.get(MODULE_ID, "imageList") as any[] || [];
        return {
            images: storedImages
        };
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
        const settings = game.settings as any;

        const allImages = settings.get(MODULE_ID, "imageList") as VisionEntry[];
        const imageData = allImages.find(img => img.id === id);
        if (!imageData) {
            writeError(`Image with ID ${id} not found in list`);
            return;
        }

        game.socket?.emit(
            SOCKET_NAME,
            {
                action: "showImage",
                path: imageData.path,
                fadeIn: imageData.fadeIn,
                fadeOut: imageData.fadeOut
            });

        const overlay = document.getElementById("cine-show-overlay");
        const img = document.getElementById("cine-show-image") as HTMLImageElement;
        if (!overlay) {
            writeError("Unable to locate overlay, exiting");
            return;
        }
        if (!img) {
            writeError("Unable to locate image, exiting");
            return;
        }

        overlay.style.setProperty('--vision-fade-in', `${imageData.fadeIn}ms`);
        overlay.style.setProperty('--vision-fade-out', `${imageData.fadeOut}ms`);

        img.src = imageData.path;
        overlay.classList.remove("hiding");
        overlay.classList.add("active");
    }
}