interface SidebarInstanceEntry {
    id: string;
    instance: any;
}

export class SidebarIntegration {
    private static instances: SidebarInstanceEntry[] = [];

    public static initialize(tabId: string, options: { icon: string, title: string, appClass: any }) {
        Hooks.on("renderSidebar", (_app: any, html: HTMLElement) => {
            const $html = $(html);
            const $tabs = $html.find("#sidebar-tabs");
            if ($tabs.find(`[data-tab="${tabId}"]`).length > 0) return;

            this.injectTabButton(html, tabId, options);
            this.injectTabSection(html, tabId, options.appClass);
        });

        Hooks.on("changeSidebarTab", (app: any) => {
            const tabName = (app as any).tabName || app.id;

            const entry = this.instances.find(x => x.id == tabName);
            if (entry?.instance) {
                entry.instance.render({ force: true });
            }
        });
    }

    private static injectTabButton(html: HTMLElement, id: string, { icon, title }: any) {
        const $html = $(html);
        const $tabs = $html.find("#sidebar-tabs");

        if ($tabs.find(`[data-tab="${id}"]`).length > 0) return;

        const tabButton = `
        <li class="item" data-tab="${id}">
            <button type="button" class="ui-control plain icon ${icon}" 
                    data-action="tab" data-tab="${id}" title="${title}" 
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
    }

    private static injectTabSection(html: HTMLElement, id: string, appClass: any) {
        const $html = $(html);
        const $content = $html.find("#sidebar-content");
        if ($content.find(`[data-tab="${id}"]`).length === 0) {
            $content.append(`<section class="tab" data-tab="${id}" id="${id}-sidebar"></section>`);
        }

        const container = html.querySelector(`#${id}-sidebar`);
        const entry = this.instances.find(x => x.id == id)
        if (container && !entry?.instance) {
            const sidebar = new appClass();
            this.instances.push({ id: id, instance: sidebar });
            (ui as any)[id] = sidebar;
        }
    }
}
