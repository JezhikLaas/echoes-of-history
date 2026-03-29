import { MODULE_ID } from "./constants";
import { warn } from "./utils/notifications";
import {writeLog} from "./utils/logging";

export type RecapOptions = {
    title?: string;
    durationMs?: number;
    waitToStart?: boolean;
};

export class Recap {
    private static isRunning: boolean = false;
    private static waitToStart: boolean = true;
    private static localIndex: number = 0;
    private static slideTimer: number | null = null;
    private static readonly OVERLAY_ID = `${MODULE_ID}-recap-overlay`;
    private static readonly FADE_MS = 600;
    private static readonly OVERLAY_FADE_MS = 800;

    public static async start(options?: RecapOptions): Promise<void>  {
        const settings = game.settings as any;
        if (!settings) return;
        if (this.isRunning || this.isOverlayOpen()) return;

        const list = this.readSectionsFromSettings();
        if (list.length === 0) {
            warn("echoes-of-history.recap.no_sections", {name: MODULE_ID});
            return;
        }

        const slideMs = Number(settings.get(MODULE_ID, "recapSlideMs") ?? 6000);
        const pauseMs = Number(settings.get(MODULE_ID, "repeatPauseMs") ?? 10000);

        this.isRunning = true;
        this.localIndex = 0;
        this.waitToStart = options?.waitToStart != undefined ? options?.waitToStart : true;
        writeLog("Wait to start is ", this.waitToStart);
        let isFollowUp = false;

        this.setOverlayContent({ bodyHtml: "", hint: "" });
        this.openOverlay();
        await this.waitForOverlayFadeIn();
        if (!this.isRunning) return;

        const tick = async (): Promise<void> => {
            if (!this.isRunning) return;

            let waitTime = slideMs;

            if (this.localIndex > 0 || isFollowUp) {
                await this.fadeOutBody();
                if (!this.isRunning) return;
            }

            const text = !isFollowUp && this.waitToStart
                ? game.i18n?.format("echoes-of-history.recap.hint-start") ?? "Click to start"
                : game.i18n?.format("echoes-of-history.recap.hint-close") ?? "Click to close"

            this.setOverlayContent({
                bodyHtml: this.formatSlideAsHtml(list, this.localIndex),
                hint: text
            });

            requestAnimationFrame(() => {
                this.fadeInBody();
            });

            if (this.waitToStart) {
                await game.audio?.awaitFirstGesture();
            }

            this.localIndex += 1;
            if (this.localIndex >= list.length) {
                isFollowUp = true;
                this.localIndex = 0;
                waitTime = pauseMs;
            }

            if (this.waitToStart) {
                waitTime = 0;
            }

            this.slideTimer = window.setTimeout(() => {
                this.waitToStart = false;
                tick()
            }, Math.max(250, waitTime));
        };

        tick();
    }

    public static stopSlideshow(): void {
        if (this.slideTimer !== null) {
            window.clearTimeout(this.slideTimer);
            this.slideTimer = null;
        }
        this.isRunning = false;
    }

    public static show(sections?: string[], _options?: RecapOptions): void {
        const list = sections ?? this.readSectionsFromSettings();
        if (list.length === 0) {
            warn("echoes-of-history.recap.no_sections", {name: MODULE_ID});
            return;
        }

        if (this.localIndex < 0 || this.localIndex >= list.length) this.localIndex = 0;

        const text = game.i18n?.format("echoes-of-history.recap.hint-close") ?? "Click to close";

        this.setOverlayContent({
            bodyHtml: this.formatSlideAsHtml(list, this.localIndex),
            hint: text
        });

        this.openOverlay();
    }

    private static isOverlayOpen(): boolean {
        const el = document.getElementById(this.OVERLAY_ID);
        return el?.classList.contains("is-open") ?? false;
    }

    private static setOverlayContent(params: { bodyHtml: string; hint: string }): void {
        const el = this.ensureOverlay();
        const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
        const hintEl = el.querySelector(".eoh-recap-hint") as HTMLDivElement | null;

        if (bodyEl) bodyEl.innerHTML = params.bodyHtml;
        if (hintEl) hintEl.textContent = params.hint;
    }

    private static openOverlay(): void {
        const el = this.ensureOverlay();
        el.classList.add("is-open");
    }

    private static fadeOutBody(): Promise<void> {
        const el = this.ensureOverlay();
        const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
        if (!bodyEl) return Promise.resolve();

        bodyEl.classList.remove("is-visible");
        return new Promise((resolve) => setTimeout(resolve, this.FADE_MS));
    }

    private static ensureOverlay(): HTMLDivElement {
        let el = document.getElementById(this.OVERLAY_ID) as HTMLDivElement | null;
        if (el) return el;

        el = document.createElement("div");
        el.id = this.OVERLAY_ID;
        el.className = "eoh-recap-overlay";
        el.innerHTML = `
            <div class="eoh-recap-card" role="dialog" aria-modal="true">
              <div class="eoh-recap-body"></div>
              <div class="eoh-recap-hint"></div>
            </div>
          `;

        el.addEventListener("click", () => {
            this.closeOverlay();
        });

        document.body.appendChild(el);
        return el;
    }

    private static closeOverlay(): void {
        writeLog("Got close command, waitToStart is ", this.waitToStart);
        if (this.waitToStart) return;

        const el = document.getElementById(this.OVERLAY_ID);
        if (!el) return;

        // Text sofort ausblenden
        const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
        bodyEl?.classList.remove("is-visible");

        // Overlay fade out, dann Klasse entfernen
        el.classList.remove("is-open");
        this.stopSlideshow();
        setTimeout(() => this.removeOverlay(), this.OVERLAY_FADE_MS);
    }

    private static removeOverlay(): void {
        const el = document.getElementById(this.OVERLAY_ID);
        el?.remove();
    }

    private static waitForOverlayFadeIn(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, this.OVERLAY_FADE_MS));
    }

    private static formatSlideAsHtml(sections: string[], activeIndex: number): string {
        const safe = this.escapeHtml(sections[activeIndex] ?? "");
        return `
            <div class="eoh-recap-slide">${safe}</div>
        `;
    }

    private static escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    private static fadeInBody(): void {
        const el = this.ensureOverlay();
        const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
        bodyEl?.classList.add("is-visible");
    }

    private static readSectionsFromSettings(): string[] {
        const settings = game.settings as any;
        if (!settings) return [];

        const raw = String(settings.get(MODULE_ID, "recapSections") ?? "[]");
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
        } catch {
            // ignore
        }
        return [];
    }
}
