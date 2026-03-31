import { DataEntry, MacroEntry } from "./settings";
import { writeWarn, writeError } from "./utils/logging";

export class MacroManager {
    public static async execute(macroEntry: MacroEntry, origin: DataEntry) {
        try {
            switch (macroEntry.type) {
                case "none":
                    return;
                case "inline": {
                    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
                    const fn = new AsyncFunction("scope", macroEntry.macroCode);
                    await fn(this.createScope(origin, []));
                    return;
                }
                case "reference": {
                    const macro = game.macros?.get(macroEntry.macroId);
                    if (macro) {
                        const scope = this.createScope(origin, macroEntry.arguments);
                        await (macro as any).execute(scope);
                    } else {
                        writeWarn(`Macro ${macroEntry.macroId} not found.`);
                    }
                    return;
                }
                default:
                    writeError("Unknown type for macro");
                    macroEntry satisfies never;
            }
        }
        catch (error) {
            writeError("Error executing inline macro:", error)
        }
    }

    private static createScope(origin: DataEntry, parameters: { key: string, value: string }[]): any {
        const parametersToMap = parameters || [];
        const mappedArgs = Object.fromEntries(
            (parametersToMap).map((a: any) => [a.key, a.value])
        );
        switch (origin.type) {
            case "mime":
                return {
                    name: origin.name,
                    ...mappedArgs
                };
            case "vision":
                return {
                    fadeIn: origin.fadeIn,
                    fadeOut: origin.fadeOut,
                    name: origin.name,
                    ...mappedArgs
                };
            default:
                writeError("Unknown type for origin");
                origin satisfies never;
        }
    }
}