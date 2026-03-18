declare global {
    namespace ClientSettings {
        interface Values {
            [key: string]: unknown;

            "echoes-of-history": {
                enabled: boolean;

                recapSections: string;
                recapSlideMs: number;
                repeatPauseMs: number;
            };
        }
    }
}

export {};