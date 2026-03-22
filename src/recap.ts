import { MODULE_ID } from "./constants";
import { warn } from "./utils";

type RecapOptions = {
    title?: string;
    durationMs?: number; // 0/undefined = bleibt, bis weggeklickt/geschlossen
};

const OVERLAY_ID = `${MODULE_ID}-recap-overlay`;
const FADE_MS = 600;
const OVERLAY_FADE_MS = 800;

let slideTimer: number | null = null;
let isRunning = false;
let localIndex = 0;

function fadeOutBody(): Promise<void> {
    const el = ensureOverlay();
    const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
    if (!bodyEl) return Promise.resolve();

    bodyEl.classList.remove("is-visible");
    return new Promise((resolve) => setTimeout(resolve, FADE_MS));
}

function fadeInBody(): void {
    const el = ensureOverlay();
    const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
    bodyEl?.classList.add("is-visible");
}

function isOverlayOpen(): boolean {
    const el = document.getElementById(OVERLAY_ID);
    return el?.classList.contains("is-open") ?? false;
}

function stopSlideshow(): void {
    if (slideTimer !== null) {
        window.clearTimeout(slideTimer);
        slideTimer = null;
    }
    isRunning = false;
}

function removeOverlay(): void {
    const el = document.getElementById(OVERLAY_ID);
    el?.remove();
}

function closeOverlay(): void {
    const el = document.getElementById(OVERLAY_ID);
    if (!el) return;

    // Text sofort ausblenden
    const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
    bodyEl?.classList.remove("is-visible");

    // Overlay fade out, dann Klasse entfernen
    el.classList.remove("is-open");
    stopSlideshow();
    setTimeout(() => removeOverlay(), OVERLAY_FADE_MS);
}

function ensureOverlay(): HTMLDivElement {
    let el = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (el) return el;

    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.className = "eoh-recap-overlay";
    el.innerHTML = `
            <div class="eoh-recap-card" role="dialog" aria-modal="true">
              <div class="eoh-recap-body"></div>
              <div class="eoh-recap-hint"></div>
            </div>
          `;

    el.addEventListener("click", () => {
        closeOverlay();
    });

    document.body.appendChild(el);
    return el;
}

function setOverlayContent(params: { bodyHtml: string; hint: string }): void {
    const el = ensureOverlay();
    const bodyEl = el.querySelector(".eoh-recap-body") as HTMLDivElement | null;
    const hintEl = el.querySelector(".eoh-recap-hint") as HTMLDivElement | null;

    if (bodyEl) bodyEl.innerHTML = params.bodyHtml;
    if (hintEl) hintEl.textContent = params.hint;
}

function openOverlay(): void {
    const el = ensureOverlay();
    el.classList.add("is-open");
}

function waitForOverlayFadeIn(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, OVERLAY_FADE_MS));
}

function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatSlideAsHtml(sections: string[], activeIndex: number): string {
    const safe = escapeHtml(sections[activeIndex] ?? "");
    return `
            <div class="eoh-recap-slide">${safe}</div>
        `;
}

function readSectionsFromSettings(): string[] {
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

export const recapApi = {
    /**
     * Zeigt genau einen Slide (lokaler Index). Startet keine Autoplay-Schleife.
     */
    show: (sections?: string[], options?: RecapOptions): void => {
        const settings = game.settings as any;
        if (!settings) return;

        const list = sections ?? readSectionsFromSettings();
        if (list.length === 0) {
            warn("echoes-of-history.recap.no_sections", {name: MODULE_ID});
            return;
        }

        if (localIndex < 0 || localIndex >= list.length) localIndex = 0;

        setOverlayContent({
            bodyHtml: formatSlideAsHtml(list, localIndex),
            hint: "Klick zum Schließen"
        });

        openOverlay();
    },

    start: async (options?: RecapOptions): Promise<void> => {
        const settings = game.settings as any;
        if (!settings) return;
        if (isRunning || isOverlayOpen()) return;

        const list = readSectionsFromSettings();
        if (list.length === 0) {
            warn("echoes-of-history.recap.no_sections", {name: MODULE_ID});
            return;
        }

        const slideMs = Number(settings.get(MODULE_ID, "recapSlideMs") ?? 6000);
        const pauseMs = Number(settings.get(MODULE_ID, "repeatPauseMs") ?? 10000);

        isRunning = true;
        localIndex = 0;
        let isFollowUp = false;

        // Overlay einblenden (Canvas faded weg), noch kein Text
        setOverlayContent({ bodyHtml: "", hint: "" });
        openOverlay();
        await waitForOverlayFadeIn();
        if (!isRunning) return;

            const tick = async (): Promise<void> => {
                if (!isRunning) return;

                let waitTime = slideMs;

                if (localIndex > 0 || isFollowUp) {
                    await fadeOutBody();
                    if (!isRunning) return;
                }

                setOverlayContent({
                    bodyHtml: formatSlideAsHtml(list, localIndex),
                    hint: "Klick zum Schließen"
                });

                requestAnimationFrame(() => {
                    fadeInBody();
                });

                localIndex += 1;
                if (localIndex >= list.length) {
                    isFollowUp = true;
                    localIndex = 0;
                    waitTime = pauseMs;
                }

                slideTimer = window.setTimeout(tick, Math.max(250, waitTime));
            };

        tick();
    },

    setSections: async (sections: string[]): Promise<void> => {
        const settings = game.settings as any;
        if (!settings) return;

        await settings.set(MODULE_ID, "recapSections", JSON.stringify(sections));
    },

    stop: (): void => {
        closeOverlay();
    }
};