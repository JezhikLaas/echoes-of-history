import {MacroManager} from "../macro-manager";
import {MODULE_ID} from "../constants";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TheatreStage extends HandlebarsApplicationMixin(ApplicationV2) {
    private static ensemble: any[] = [];
    private static activeMimeId: string | null = null;
    private static isOpening: boolean = false;

    static override DEFAULT_OPTIONS = {
        id: "theatre-stage",
        tag: "aside",
        window: {
            frame: false,
            resizable: false
        },
        actions: {
            setSpotlight: TheatreStage.#onSetSpotlight,
            removeMime: TheatreStage.#onRemoveMime,
            closeStage: TheatreStage.#onCloseStage
        }
    };

    static override PARTS = {
        stage: {
            template: "modules/echoes-of-history/templates/theatre-stage.hbs"
        }
    };

    public static get isActive(): boolean {
        return this.ensemble?.length > 0;
    }

    protected override async _prepareContext(_options: any): Promise<any> {
        return {
            ensemble: (this.constructor as typeof TheatreStage).ensemble,
            activeMimeId: (this.constructor as typeof TheatreStage).activeMimeId,
            isGM: game.user?.isGM,
            isOpening: (this.constructor as typeof TheatreStage).isOpening
        };
    }

    static async #onSetSpotlight(this: TheatreStage, _event: PointerEvent, target: HTMLElement) {
        if (!game.user?.isGM) {
            return;
        }

        const mimeId = target.dataset.mimeId;
        const oldMimeId = TheatreStage.activeMimeId;

        await this.activateMime(mimeId, oldMimeId)
    }

    public async activateMime(newActive: string | undefined, oldActive: string | null) {
        TheatreStage.isOpening = false;

        if (TheatreStage.activeMimeId === newActive) {
            TheatreStage.activeMimeId = null;
        } else {
            TheatreStage.activeMimeId = newActive || null;
        }

        if (!game.user?.isGM) {
            await this.render({ force: false });
            return;
        }

        if (oldActive) {
            const oldMime = TheatreStage.ensemble.find(m => m.id === oldActive);
            if (oldMime) await MacroManager.execute(oldMime.onExitExecute);
        }

        if (TheatreStage.activeMimeId) {
            const newMime = TheatreStage.ensemble.find(m => m.id === TheatreStage.activeMimeId);
            if (newMime) await MacroManager.execute(newMime.onEnterExecute);
        }

        game.socket?.emit(`module.${MODULE_ID}`, {
            action: "activateMime",
            active: TheatreStage.activeMimeId
        });


        await this.render({ force: false });
    }

    static async #onRemoveMime(this: TheatreStage, _event: PointerEvent, target: HTMLElement) {
        const mimeId = target.dataset.mimeId;
        const currentEnsemble = (this.constructor as typeof TheatreStage).ensemble;

        const newEnsemble = currentEnsemble.filter(m => m.id !== mimeId);
        (this.constructor as typeof TheatreStage).ensemble = newEnsemble;

        if (newEnsemble.length === 0) {
            await this.close();
        } else {
            await this.render({ force: false });
        }
    }

    static async #onCloseStage(this: TheatreStage, _event: PointerEvent, _target: HTMLElement) {
        TheatreStage.ensemble = [];
        if (game.user?.isGM) {
            game.socket?.emit(`module.${MODULE_ID}`, {
                action: "closeStage"
            });
        }
        await this.close();
    }

    public static startConversation(nscEntries: any[], broadcast: boolean = true) {
        this.ensemble = nscEntries.slice(0, 4);
        this.activeMimeId = null;
        this.isOpening = true;

        const hud = (ui as any).theatreStage || new TheatreStage();
        (ui as any).theatreStage = hud;
        hud.render({ force: true });

        if (broadcast && game.user?.isGM) {
            game.socket?.emit(`module.${MODULE_ID}`, {
                action: "openStage",
                ensemble: this.ensemble
            });
        }
    }
}