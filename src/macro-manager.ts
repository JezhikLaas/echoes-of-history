import { MacroEntry } from "./settings";

export class MacroManager {
    public static async execute(entry : MacroEntry) {
        if (entry.type === "none") {
            return;
        }
    }
}