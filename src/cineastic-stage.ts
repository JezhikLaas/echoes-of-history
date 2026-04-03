import { SocketDispatcher } from "./socket-dispatcher";
import { TheatreStage } from "./ui/theatre-stage";
import { MimeManager } from "./mime-manager";

export class CineasticStageManager {
    public static initialize() {
        SocketDispatcher.register("openStage", async (data: any) => {
            TheatreStage.startConversation(data.ensemble, false);
        });
        SocketDispatcher.register("closeStage", async () => {
            (ui as any).theatreStage?.close();
        });
        SocketDispatcher.register("activateMime", async (data: any) => {
            await (ui as any).theatreStage.activateMime(data.active, data.inactive || null);
        });
        SocketDispatcher.register("updateMimeVisibility", (data: any) => {
            TheatreStage.updateMimeVisibility(data.mimeId, data.visible);
        });

        Hooks.on("renderTokenHUD", (app: any, html: HTMLElement, data: any) => {
            const $html = $(html);
            const button = $(`
        <div class="echoes-of-history" style="display: contents;">
            <div class="control-icon hud-button" title="${game.i18n?.localize('echoes-of-history.hud.add-to-mime')}">
                <i class="fas fa-theater-masks"></i>
            </div>
        </div>
    `);

            button.on("click", async (event: JQuery.ClickEvent) => {
                event.preventDefault();

                const token = canvas?.tokens?.get(data._id);
                if (!token?.actor) return;

                const actorUuid = token.actor.uuid;

                if (event.shiftKey) {
                    await MimeManager.instance.addMimeFromActor({ uuid: actorUuid }, null);
                } else {
                    await MimeManager.instance.addActorToOpenStage({ uuid: actorUuid });
                }
            });

            $html.find(".col.right").append(button);
        });
    }
}
