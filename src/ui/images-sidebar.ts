import {MODULE_ID, SOCKET_NAME} from "../constants";

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
            deleteImage: ImagesSidebar.#onDeleteImage
        }
    };

    static override PARTS: any = {
        main: {
            template: `modules/${MODULE_ID}/templates/images-sidebar.hbs`
        }
    };

    static async #onAddImage(this: ImagesSidebar, event: PointerEvent, target: HTMLElement) {
        const picker = new (foundry.applications.apps as any).FilePicker({
            type: "image",
            callback: (path: string) => this._addImage(path)
        });
        picker.render(true);
    }

    static #onShowImage(this: ImagesSidebar, event: PointerEvent, target: HTMLElement) {
        const path = target.dataset.path;
        if (path) this.broadcastShow(path);
    }

    static #onDeleteImage(this: ImagesSidebar, event: PointerEvent, target: HTMLElement) {
        const index = parseInt(target.dataset.index || "0");
        this._deleteImage(index);
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
        const name = path.split("/").pop() || "New Image";
        currentList.push({ name, path });
        await settings.set(MODULE_ID, "imageList", currentList);
        this.render(true);
    }

    private async _deleteImage(index: number) {
        const settings = game.settings as any;
        const currentList = settings.get(MODULE_ID, "imageList") as any[];
        currentList.splice(index, 1);
        await settings.set(MODULE_ID, "imageList", currentList);
        this.render(true);
    }

    broadcastShow(path: string) {
        console.log(`Broadcasting image show: ${path}`);
        game.socket?.emit(SOCKET_NAME, { action: "showImage", path });
        const overlay = document.getElementById("cine-show-overlay");
        const img = document.getElementById("cine-show-image") as HTMLImageElement;
        if (overlay && img) {
            img.src = path;
            overlay.classList.add("active");
        }
    }
}