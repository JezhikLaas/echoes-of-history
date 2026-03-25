import { Recap, RecapOptions } from "../recap";

export class EchoesOfHistory {
    public static show(sections?: string[], options?: RecapOptions): void {
        Recap.show(sections, options);
    }

    public static async start(options?: RecapOptions): Promise<void> {
        Recap.start(options);
    }

    public static stop(): void {
        Recap.stopSlideshow();
    }
}