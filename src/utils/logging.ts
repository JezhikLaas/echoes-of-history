import { MODULE_ID } from "../constants";

export function writeLog(...args: unknown[]) {
    console.log(`[${MODULE_ID}]`, ...args);
}

export function writeWarn(...args: unknown[]) {
    console.log(`[${MODULE_ID}]`, ...args);
}

export function writeError(...args: unknown[]) {
    console.log(`[${MODULE_ID}]`, ...args);
}
