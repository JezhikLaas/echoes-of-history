import { MODULE_ID } from "./constants";
import { recapApi } from "./recap";
import { registerSettings } from "./settings";

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
            version: "0.1.0",
            moduleId: MODULE_ID
        };
    } else {
        g.RECAP_ECHOES.recap = recapApi;
    }
});

Hooks.once("ready", () => {
    console.log(`[${MODULE_ID}] ready`);
});