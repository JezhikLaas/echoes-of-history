import { MODULE_ID, SOCKET_NAME } from "./constants";
import { VisionEntry } from "./settings";
import { writeWarn } from "./utils";

export class VisionManager {
    private static async setActiveId(id: string | null) {
        const settings = game.settings as any;
        await settings.set(MODULE_ID, "activeVisionState", id || "");
    }

    private static get activeId(): string {
        const settings = game.settings as any;
        return settings.get(MODULE_ID, "activeVisionState") as string;
    }

    public static async showVision(id: string) {
        const entry = this.getEntryById(id);
        if (!entry) {
            writeWarn(`Image with ID ${id} not found in list, exiting`);
            return;
        }

        if (game.user?.isGM) {
            await this.setActiveId(id);
            // We do not want to wait here
            this.executeVisionMacro(entry, entry.fadeInExecute);
            game.socket?.emit(
                SOCKET_NAME,
                {
                    action: "showImage",
                    id: entry.id
                });
        }
        this.showOverlayLocally(entry);
    }

    public static async hideVision() {
        if (!this.activeId) return;

        if (game.user?.isGM) {
            const entry = this.getEntryById(this.activeId)
            if (entry) {
                await this.executeVisionMacro(entry, entry.fadeOutExecute);
            }

            game.socket?.emit(SOCKET_NAME, { action: "hideImage" });
            await this.setActiveId(null);
        }

        this.hideOverlayLocally();
    }

    private static getEntryById(id: string): VisionEntry | undefined {
        const settings = game.settings as any;
        const allImages = settings.get(MODULE_ID, "imageList") as VisionEntry[];
        return allImages.find(img => img.id === id);
    }

    private static async executeVisionMacro(entry: VisionEntry, macroData: any) {
        if (!macroData || macroData.type === "none") return;

        const mappedArgs = Object.fromEntries(
            (macroData.arguments || []).map((a: any) => [a.key, a.value])
        );

        const scope = {
            fadeIn: entry.fadeIn,
            fadeOut: entry.fadeOut,
            name: entry.name,
            ...mappedArgs
        };

        try {
            if (macroData.type === "inline" && macroData.macroCode) {
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const fn = new AsyncFunction("scope", macroData.macroCode);
                await fn(scope);
            }
            else if (macroData.type === "reference" && macroData.macroId) {
                const macro = game.macros?.get(macroData.macroId);
                if (macro) {
                    await (macro as any).execute(scope);
                } else {
                    console.warn(`${MODULE_ID} | Macro ${macroData.macroId} not found.`);
                }
            }
        } catch (error) {
            writeWarn("Error executing macro:", error)
        }
    }

    public static showOverlayLocally(entry?: VisionEntry, isRefresh = false) {
        if (!entry) {
            const currentId = this.activeId;
            if (!currentId) return;
            entry = this.getEntryById(currentId);
            if (!entry) {
                return;
            }
            isRefresh = true;
        }

        const overlay = document.getElementById("cine-show-overlay");
        const img = document.getElementById("cine-show-image") as HTMLImageElement;
        if (!overlay || !img) return;

        const durationIn = isRefresh ? 0 : entry.fadeIn;
        overlay.style.setProperty('--vision-fade-in', `${durationIn}ms`);
        overlay.style.setProperty('--vision-fade-out', `${entry.fadeOut}ms`);

        img.src = entry.path;
        overlay.classList.remove("hiding");
        overlay.classList.add("active");
    }

    private static hideOverlayLocally() {
        const overlay = document.getElementById("cine-show-overlay");
        if (overlay) {
            overlay.classList.add("hiding");
            overlay.classList.remove("active");
        }
    }
}