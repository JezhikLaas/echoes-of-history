import { MODULE_ID } from "./constants";
import { registerSettings } from "./settings";
import { ImagesSidebar } from "./ui/images-sidebar";
import { SidebarIntegration } from "./utils/sidebar-integration";
import { VisionManager } from "./vision-manager";
import { CineasticScenes } from "./api/cineastic-scenes";
import { EchoesOfHistory } from "./api/echoes-of-history";
import { writeLog } from "./utils/logging";

function initializeApi(): void {
    const g = game as any;

    const echoesApi = {
        recap: EchoesOfHistory,
        cineShow: CineasticScenes,
        version: "0.2.0",
        moduleId: MODULE_ID
    };

    const mod = g.modules?.get?.(MODULE_ID) as { api?: unknown } | undefined;
    if (mod) {
        mod.api = echoesApi;
    }

    g["echoes"] = echoesApi;
    g.RECAP_ECHOES = echoesApi;

    writeLog("API initialized: game.echoes and legacy game.RECAP_ECHOES are ready.");
}

async function registerPartialTemplates(): Promise<void> {
    // I never found
    await ImagesSidebar.registerPartials();
}

Hooks.once("init", async () => {
    writeLog("start init");

    registerSettings();
    await registerPartialTemplates();

    SidebarIntegration.initialize(MODULE_ID, {
        icon: "fa-solid fa-clapperboard",
        title: "Images to show",
        appClass: ImagesSidebar
    });

    writeLog("init done");
});

Hooks.once("ready", () => {
    VisionManager.initialize();
    initializeApi();

    writeLog("ready");
});

