import { SocketDispatcher } from "./socket-dispatcher";
import { TheatreStage } from "./ui/theatre-stage";

export class CineasticStageManager {
    public static initialize() {
        SocketDispatcher.register("openStage", async (data: any) => {
            TheatreStage.startConversation(data.ensemble, false);
        });
        SocketDispatcher.register("closeStage", async () => {
            (ui as any).theatreStage?.close();
        });
        SocketDispatcher.register("activateMime", async (data: any) => {
            await (ui as any).theatreStage.activateMime(data.active, null);
        });
    }
}
