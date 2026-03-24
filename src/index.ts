import { MODULE_ID, SOCKET_NAME } from "./constants";
import { recapApi } from "./recap";
import { registerSettings } from "./settings";
import { ImagesSidebar } from "./ui/images-sidebar";
import { writeLog } from "./utils";
import { VisionManager } from "./VisionManager";

let imagesSidebar: ImagesSidebar | null = null;

function applyVisionTimings(): void {
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

Hooks.once("init", async () => {
    writeLog("start init");

    registerSettings();

    const g = game as any;

    const mod = g.modules?.get?.(MODULE_ID) as { api?: unknown } | undefined;
    if (mod) {
        mod.api = { recap: recapApi };
    }

    if (!g.RECAP_ECHOES) {
        g.RECAP_ECHOES = {
            recap: recapApi,
            version: "0.2.0",
            moduleId: MODULE_ID
        };
    } else {
        g.RECAP_ECHOES.recap = recapApi;
    }

    const settings = game.settings as any;
    settings.register(MODULE_ID, "imageList", {
        name: "Stored Cinematic Images",
        scope: "world",
        config: false,
        type: Object,
        default: []
    });
    settings.register(MODULE_ID, "activeVisionState", {
        name: "Aktive Vision ID",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    const partialPath = `modules/${MODULE_ID}/templates/directory-item.hbs`;
    const partialContent = await getTemplate(partialPath);
    Handlebars.registerPartial("directoryItem", partialContent);

    writeLog("init done");
});

Hooks.once("ready", () => {
    const overlay = document.createElement("div");

    overlay.id = "cine-show-overlay";
    overlay.innerHTML = `<img id="cine-show-image" src="" alt="">`;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", async () => {
        await VisionManager.hideVision();
    });

    writeLog("Restoring active vision after refresh");
    VisionManager.showOverlayLocally(undefined, true);

    writeLog(`Socket Listener wird registriert auf: ${SOCKET_NAME}`);

    game.socket?.on(SOCKET_NAME, async (data: any) => {
        const overlayElement = document.getElementById("cine-show-overlay");
        const imgElement = document.getElementById("cine-show-image") as HTMLImageElement;

        if (data.action === "showImage" && overlayElement && imgElement) {
            await VisionManager.showVision(data.id);
        } else if (data.action === "hideImage" && overlayElement) {
            await VisionManager.hideVision();
        }
    });

    applyVisionTimings();
    writeLog("ready");
});

Hooks.on("closeSettingsConfig", () => applyVisionTimings());

Hooks.on("renderSidebar", (_app: Sidebar, html: HTMLElement, _data: any) => {
    const $html = $(html);
    const $tabs = $html.find("#sidebar-tabs");

    if ($tabs.find(`[data-tab="${MODULE_ID}"]`).length > 0) return;

    const tabButton = `
        <li class="item" data-tab="${MODULE_ID}">
            <button type="button" class="ui-control plain icon fa-solid fa-clapperboard" 
                    data-action="tab" data-tab="${MODULE_ID}" title="Images to show" 
                    role="tab" aria-pressed="false" data-group="primary">
                <div class="notification-pip"></div>
            </button>
        </li>
    `;

    const $settingsLi = $tabs.find('[data-tab="settings"]').closest('li');
    if ($settingsLi.length > 0) {
        $settingsLi.before(tabButton);
    } else {
        $tabs.append(tabButton);
    }

    const $content = $html.find("#sidebar-content");
    if ($content.find(`[data-tab="${MODULE_ID}"]`).length === 0) {
        $content.append(`<section class="tab" data-tab="${MODULE_ID}" id="${MODULE_ID}-sidebar"></section>`);
    }

    const container = html.querySelector(`#${MODULE_ID}-sidebar`);
    if (container && !imagesSidebar) {
        imagesSidebar = new ImagesSidebar();
        (ui as any)[MODULE_ID] = imagesSidebar;
    }
});

Hooks.on("changeSidebarTab", (app: any) => {
    const tabName = (app as any).tabName || app.id;

    if (tabName === MODULE_ID) {
        if (imagesSidebar) {
            imagesSidebar.render({ force: true });
        }
    }
});