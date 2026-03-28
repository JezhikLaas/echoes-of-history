import { DataEntry, MacroEntry } from "./settings";
import { writeWarn, writeError } from "./utils/logging";

export class MacroManager {
    public static async execute(macroEntry: MacroEntry, origin: DataEntry) {
        try {
            switch (macroEntry.type) {
                case "none":
                    return;
                case "inline": {
                    const AsyncFunction = Object.getPrototypeOf(async function () {
                    }).constructor;
                    const fn = new AsyncFunction("scope", macroEntry.macroCode);
                    await fn(this.createScope(origin, []));
                    return;
                }
                case "reference": {
                    const macro = game.macros?.get(macroEntry.macroId);
                    if (macro) {
                        await (macro as any).execute(this.createScope(origin, macroEntry.arguments));
                    } else {
                        writeWarn(`Macro ${macroEntry.macroId} not found.`);
                    }
                    return;
                }
                default:
                    macroEntry satisfies never;
            }
        }
        catch (error) {
            writeError("Error executing inline macro:", error)
        }
    }

    private static createScope(data: DataEntry, parameters: { key: string, value: string }[]): any {
        const mappedArgs = Object.fromEntries(
            (parameters).map((a: any) => [a.key, a.value])
        );
        switch (data.type) {
            case "mime":
                return {
                    name: data.name,
                    ...mappedArgs
                };
            case "vision":
                return {
                    fadeIn: data.fadeIn,
                    fadeOut: data.fadeOut,
                    name: data.name,
                    ...mappedArgs
                };
            default:
                data satisfies never;
        }
    }
}