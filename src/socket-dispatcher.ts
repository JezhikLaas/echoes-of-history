import {writeWarn} from "./utils/logging";

type SocketHandler = (payload: any) => void | Promise<void>;

export class SocketDispatcher {
    private static _handlers = new Map<string, SocketHandler>();

    public static register(action: string, handler: SocketHandler) {
        this._handlers.set(action, handler);
    }

    public static async dispatch(payload: any) {
        if (!payload.action) return;

        const handler = this._handlers.get(payload.action);
        if (handler) {
            await handler(payload);
        } else {
            writeWarn(`No handler for "${payload.action}" found.`);
        }
    }
}