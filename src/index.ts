import { MODULE_ID, SOCKET_NAME } from "./constants";
import { recapApi } from "./recap";
import { registerSettings } from "./settings";
import { ImagesSidebar } from "./ui/images-sidebar";

let imagesSidebar: ImagesSidebar | null = null;

Hooks.once("init", () => {
    console.log(`[${MODULE_ID}] init`);

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
});

Hooks.once("ready", () => {
    const overlay = document.createElement("div");
    overlay.id = "cine-show-overlay";
    overlay.innerHTML = `<img id="cine-show-image" src="" alt="">`;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", () => {
        overlay.classList.remove("active");

        if (game.user?.isGM) {
            game.socket?.emit(SOCKET_NAME, { action: "hideImage" });
        }
    });

    console.log(`${MODULE_ID} | Socket Listener wird registriert auf: ${SOCKET_NAME}`);

    game.socket?.on(SOCKET_NAME, (data: any) => {
        const overlayElement = document.getElementById("cine-show-overlay");
        const imgElement = document.getElementById("cine-show-image") as HTMLImageElement;

        console.log("Overlay DOM-Element vorhanden:", !!overlay);
        console.log("Image DOM-Element vorhanden:", !!imgElement);

        if (data.action === "showImage" && overlayElement && imgElement) {
            console.log("Triggering Show Animation...");
            imgElement.src = data.path;
            overlay.classList.remove("hiding");
            overlayElement.classList.add("active");
        } else if (data.action === "hideImage" && overlayElement) {
            console.log("Triggering Hide Animation...");
            overlay.classList.add("hiding");
            overlayElement.classList.remove("active");
        }
    });

    console.log(`[${MODULE_ID}] ready`);
});


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