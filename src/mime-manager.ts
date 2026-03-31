import { MimeEntry } from "./settings";
import { warn } from "./utils/notifications";
import { writeWarn } from "./utils/logging";
import { MODULE_ID } from "./constants";
import { TheatreStage } from "./ui/theatre-stage";

interface UIElement {
    render(options?: any): Promise<any>;
}

export class MimeManager {
    private _owner: UIElement;
    private static _instance: MimeManager;

    constructor(owner: UIElement) {
        MimeManager._instance = this;
        this._owner = owner;
    }

    public static get instance(): MimeManager {
        return this._instance;
    }

    public async addMimeFromDropData(data: any, folderId: string | null) {
        const mime = await this.createMimeFromDropData(data, folderId);
        await this.addMimeToDatabase(mime);
    }

    public async addMimeFromActor(data: any, folderId: string | null) {
        const mime = await this.createMimeFromActor(data, folderId);
        await this.addMimeToDatabase(mime);
    }

    public async addFromDropDataToOpenStage(data: any) {
        const mime = await this.createMimeFromDropData(data, null);
        await this.showMimeOnStage(mime);
    }

    public async createMimeFromDropData(data: any, folderId: string | null): Promise<MimeEntry | null> {
        switch (data?.type) {
            case "JournalEntry": {
                if (!data.fcbData) {
                    warn("echoes-of-history.sidebar.invalid_type", {
                        name: data.fcbData.name
                    });
                    return null;
                }
                if (data.fcbData.topic !== 1 && data.fcbData.topic !== 4) {
                    warn("echoes-of-history.sidebar.invalid_type", {
                        name: data.fcbData.name
                    });
                    return null;
                }

                return await this.createMimeFromWcbCharacter(data, folderId);
            }
            case "Actor": {
                return await this.createMimeFromActor(data, folderId);
            }
        }

        writeWarn("Unhandled type to create actor from")
        return null;
    }

    private async addMimeToDatabase(mime: MimeEntry | null) {
        if (!mime) {
            return;
        }
        const settings = game.settings as any;
        const allEntries = settings.get(MODULE_ID, "imageList") as any[] || [];

        if (allEntries.find(m => m.id == mime.id)) {
            warn("echoes-of-history.sidebar.already-added", { name: mime.name });
            return;
        }

        allEntries.push(mime);
        await settings.set(MODULE_ID, "imageList", allEntries);
        await this._owner.render({ force: true });
    }

    public async addActorToOpenStage(data: any) {
        const mime = await this.createMimeFromActor(data, null);
        await this.showMimeOnStage(mime);
    }

    private async showMimeOnStage(mime: MimeEntry | null) {
        if (!mime) {
            return;
        }

        if (TheatreStage.isActive) {
            TheatreStage.addToConversation([mime]);
        }
        else {
            TheatreStage.startConversation([mime]);
        }

        await this._owner.render();
    }

    private async createMimeFromActor(data: any, folderId: string | null): Promise<MimeEntry | null> {
        const mime = await fromUuid(data.uuid) as any;
        if (!mime) return null;

        return {
            type: "mime",
            id: data.uuid,
            name: mime.name,
            shortName: mime.name,
            path: mime.img,
            visible: true,
            onEnterExecute: { type: "none" },
            onExitExecute: { type: "none" },
            parentId: folderId
        };
    }

    private async createMimeFromWcbCharacter(data: any, folderId: string | null): Promise<MimeEntry | null> {
        const uuid = data.uuid ?? data.fcbData?.childId;
        if (!uuid) {
            writeWarn("Unable to extract uuid", data);
            return null;
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

        const name = data.fcbData.name
            ? data.fcbData.typeName
                ? data.fcbData.name + " (" + data.fcbData.typeName + ")"
                : data.fcbData.name
            : "Unknown";

        return {
            type: "mime",
            id: uuid,
            name: name,
            shortName: name,
            path: img,
            visible: true,
            onEnterExecute: { type: "none" },
            onExitExecute: { type: "none" },
            parentId: folderId
        };
    }
}
