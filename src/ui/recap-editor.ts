
import { MODULE_ID } from "../constants";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RecapEditor extends HandlebarsApplicationMixin(ApplicationV2) {

    static override DEFAULT_OPTIONS: any = {
        id: `${MODULE_ID}-recap-editor`,
        tag: "form",
        window: {
            title: "Recap: Abschnitte bearbeiten",
            resizable: true
        },
        position: {
            width: 620,
            height: 480
        },
        form: {
            handler: RecapEditor.onSubmit,
            closeOnSubmit: true
        }
    };

    static override PARTS: any = {
        form: {
            template: `modules/${MODULE_ID}/templates/recap-editor.hbs`
        }
    };

    override async _prepareContext(_options: any): Promise<any> {
        const settings = game.settings as any;
        const json = String(settings?.get(MODULE_ID, "recapSections") ?? "[]");

        let sections: string[] = [];
        try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) sections = parsed;
        } catch {
            // ignore
        }

        const rawText = sections.join("\n\n");
        return { rawText };
    }

    static async onSubmit(
        this: RecapEditor,
        _event: Event,
        _form: HTMLFormElement,
        formData: FormDataExtended
    ): Promise<void> {
        const raw = String(formData.object["recapText"] ?? "");
        const sections = parseRecapText(raw);

        const settings = game.settings as any;
        await settings.set(MODULE_ID, "recapSections", JSON.stringify(sections));

        ui.notifications?.info(`[${MODULE_ID}] ${sections.length} Abschnitt(e) gespeichert.`);
    }
}

export function parseRecapText(raw: string): string[] {
    return raw
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}