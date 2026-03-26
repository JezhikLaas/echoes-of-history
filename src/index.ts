import { MODULE_ID } from "./constants";
import { registerSettings } from "./settings";
import { ImagesSidebar } from "./ui/images-sidebar";
import { SidebarIntegration } from "./utils/sidebar-integration";
import { VisionManager } from "./vision-manager";
import { writeLog } from "./utils/logging";
import { initializeApi } from "./api/api-registration";

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
        title: "Images to show",
        appClass: ImagesSidebar
    });

    writeLog("init done");
});

Hooks.once("ready", () => {
    VisionManager.initialize();
    writeLog("ready");
});

