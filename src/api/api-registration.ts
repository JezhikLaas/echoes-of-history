import { writeLog } from "../utils/logging";
import { MODULE_ID } from "../constants";
import { EchoesOfHistory } from "./echoes-of-history";
import { CineasticScenes } from "./cineastic-scenes";

export function initializeApi(): void {
    const g = game as any;

    const echoesApi = {
        recap: EchoesOfHistory,
        cineShow: CineasticScenes,
        version: "0.3.0",
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
