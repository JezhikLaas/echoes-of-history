import { MODULE_ID, SOCKET_NAME } from "./constants";
import { VisionEntry } from "./settings";
import {writeLog, writeWarn} from "./utils/logging";
import {CineasticScenes} from "./api/cineastic-scenes";
import {SocketDispatcher} from "./socket-dispatcher";
import {MacroManager} from "./macro-manager";

export class VisionManager {
    public static initialize() {
        const overlay = document.createElement("div");

        overlay.id = "cine-show-overlay";
        overlay.innerHTML = `<img id="cine-show-image" src="" alt="">`;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", async () => {
            await VisionManager.hideVision();
        });

        writeLog("Restoring active vision after refresh");
        VisionManager.showOverlayLocally(undefined, true);

        SocketDispatcher.register("showImage", async (data: any) => {
            const overlayElement = document.getElementById("cine-show-overlay");
            const imgElement = document.getElementById("cine-show-image") as HTMLImageElement;

            if (overlayElement && imgElement) {
                await VisionManager.showVision(data.id);
            }
        });
        SocketDispatcher.register("hideImage", async () => {
            const overlayElement = document.getElementById("cine-show-overlay");

            if (overlayElement) {
                await VisionManager.hideVision();
            }
        });

        this.applyVisionTimings();
        Hooks.on("closeSettingsConfig", () => this.applyVisionTimings());
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
            MacroManager.execute(entry.fadeInExecute, entry);
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
                await MacroManager.execute(entry.fadeOutExecute, entry);
            }
            CineasticScenes.resetState();

            game.socket?.emit(SOCKET_NAME, { action: "hideImage" });
            await this.setActiveId(null);
        }

        this.hideOverlayLocally();
    }

    private static applyVisionTimings(): void{
        const settings = game.settings as any;
        const fadeIn = settings.get(MODULE_ID, "echoFadeIn") as number;
        const fadeOut = settings.get(MODULE_ID, "echoFadeOut") as number;

        const overlay = document.getElementById("cine-show-overlay");
        if (overlay) {
            overlay.style.setProperty('--vision-fade-in', `${fadeIn}ms`);
            overlay.style.setProperty('--vision-fade-out', `${fadeOut}ms`);
            console.log(`${MODULE_ID} | Vision Timings updated: In ${fadeIn}ms, Out ${fadeOut}ms`);
        }
    }

    private static async setActiveId(id: string | null) {
        const settings = game.settings as any;
        await settings.set(MODULE_ID, "activeVisionState", id || "");
    }

    private static get activeId(): string {
        const settings = game.settings as any;
        return settings.get(MODULE_ID, "activeVisionState") as string;
    }

    private static getEntryById(id: string): VisionEntry | undefined {
        const settings = game.settings as any;
        const allImages = settings.get(MODULE_ID, "imageList") as VisionEntry[];
        return allImages.find(img => img.id === id);
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