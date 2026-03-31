import { MacroManager } from "../macro-manager";
import { MODULE_ID } from "../constants";
import { MimeEntry } from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TheatreStage extends HandlebarsApplicationMixin(ApplicationV2) {
    private static ensemble: MimeEntry[] = [];
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

    public static get currentMimeId(): string | null {
        return TheatreStage.activeMimeId;
    }

    public static updateMimeVisibility(mimeId: string, visible: boolean) {
        const mime = this.ensemble.find(m => m.id === mimeId);
        if (mime) {
            mime.visible = visible;
        }

        const el = document.getElementById(`mime-${mimeId}`);
        if (el) {
            el.style.display = visible ? "" : "none";
        }

        if (game.user?.isGM) {
            game.socket?.emit(`module.${MODULE_ID}`, {
                action: "updateMimeVisibility",
                mimeId: mimeId,
                visible: visible
            });
        }
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
        await TheatreStage.closeConversation(this);
    }

    public static startConversation(nscEntries: MimeEntry[], broadcast: boolean = true) {
        this.ensemble = nscEntries.slice(0, 10);
        this.activeMimeId = null;
        this.isOpening = true;
        this.openCurtain(broadcast);
    }

    public static addToConversation(nscEntries: MimeEntry[], broadcast: boolean = true) {
        // Should be okay, we do not have that much mimes.
        if (nscEntries.find(n => this.ensemble.find(e => e.id == n.id))) {
            return;
        }

        this.ensemble = [...this.ensemble, ...nscEntries];
        this.openCurtain(broadcast);
    }

    private static openCurtain(broadcast: boolean) {
        const hud = (ui as any).theatreStage || new TheatreStage();
        (ui as any).theatreStage = hud;
        hud.render({ force: true }).then(() => {
            setTimeout(() => {
                const el = document.getElementById("theatre-stage");
                if (el) el.classList.remove("is-opening");
            }, 2000);
        })

        if (broadcast && game.user?.isGM) {
            game.socket?.emit(`module.${MODULE_ID}`, {
                action: "openStage",
                ensemble: this.ensemble
            });
        }
    }

    public static async closeConversation(instance: TheatreStage) {
        TheatreStage.ensemble = [];
        if (game.user?.isGM) {
            game.socket?.emit(`module.${MODULE_ID}`, {
                action: "closeStage"
            });
        }
        await instance.close();
    }

    public async activateMime(newActive: string | undefined, oldActive: string | null) {
        TheatreStage.isOpening = false;

        if (TheatreStage.activeMimeId === newActive) {
            TheatreStage.activeMimeId = null;
        } else {
            TheatreStage.activeMimeId = newActive || null;
        }

        this.applySpotlightToDOM(oldActive, TheatreStage.activeMimeId);

        if (!game.user?.isGM) {
            return;
        }

        if (oldActive) {
            const oldMime = TheatreStage.ensemble.find(m => m.id === oldActive);
            if (oldMime) await MacroManager.execute(oldMime.onExitExecute, oldMime);
        }

        if (TheatreStage.activeMimeId) {
            const newMime = TheatreStage.ensemble.find(m => m.id === TheatreStage.activeMimeId);
            if (newMime) await MacroManager.execute(newMime.onEnterExecute, newMime);
        }

        game.socket?.emit(`module.${MODULE_ID}`, {
            action: "activateMime",
            active: TheatreStage.activeMimeId,
            inactive: oldActive
        });
    }

    private applySpotlightToDOM(oldId: string | null, newId: string | null) {
        if (oldId) {
            const oldEl = document.getElementById(`mime-${oldId}`);
            if (oldEl) {
                oldEl.classList.remove("is-active");
                const frame = oldEl.querySelector<HTMLElement>(".mime-portrait-frame");
                if (frame) {
                    frame.style.transform = "scale(0.9) translateY(0)";
                    frame.style.filter = "grayscale(0.5) brightness(0.6) blur(2px)";
                }
            }
        }
        if (newId) {
            const newEl = document.getElementById(`mime-${newId}`);
            if (newEl) {
                newEl.classList.add("is-active");
                const frame = newEl.querySelector<HTMLElement>(".mime-portrait-frame");
                if (frame) {
                    frame.style.transform = "scale(1.1) translateY(-30px)";
                    frame.style.filter = "grayscale(0) brightness(1.2) blur(0)";
                }
            }
        }
    }
}