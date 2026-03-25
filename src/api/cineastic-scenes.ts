export class CineasticScenes {
    private static state: Record<string, any> = {};

    public static set(key: string, value: any): void {
        this.state[key] = value;
    }

    public static get<T>(key: string): T | undefined {
        return this.state[key] as T;
    }

    public static stopInterval(key: string = "activeInterval"): void {
        if (this.state[key]) {
            clearInterval(this.state[key]);
            delete this.state[key];
        }
    }

    public static clearAllIntervals(): void {
        Object.keys(this.state).forEach(key => {
            if (key.toLowerCase().includes("interval")) {
                this.stopInterval(key);
            }
        });
    }
}