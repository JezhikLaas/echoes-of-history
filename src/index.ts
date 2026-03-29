import {MODULE_ID, SOCKET_NAME} from "./constants";
import { registerSettings } from "./settings";
import { ImagesSidebar } from "./ui/images-sidebar";
import { SidebarIntegration } from "./utils/sidebar-integration";
import { VisionManager } from "./vision-manager";
import { writeLog } from "./utils/logging";
import { initializeApi } from "./api/api-registration";
import { SocketDispatcher } from "./socket-dispatcher";
import {CineasticStageManager} from "./cineastic-stage";

async function registerPartialTemplates(): Promise<void> {
    await ImagesSidebar.registerPartials();
}

Hooks.once("init", async () => {
    writeLog("start init");

    registerSettings();
    await registerPartialTemplates();
    initializeApi();

    SidebarIntegration.initialize(MODULE_ID, {
        icon: "fa-solid fa-clapperboard",
        title: "Echoes of history",
        appClass: ImagesSidebar,
        gmOnly: true
    });

    writeLog("init done");
});

Hooks.once("ready", () => {
    // Must be the first one.
    writeLog(`Socket Listener wird registriert auf: ${SOCKET_NAME}`);
    game.socket?.on(`module.${MODULE_ID}`, async (payload: any) => {
        await SocketDispatcher.dispatch(payload);
    });

    VisionManager.initialize();
    CineasticStageManager.initialize();

    writeLog("ready");
});

