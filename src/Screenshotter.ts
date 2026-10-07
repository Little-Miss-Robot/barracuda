import {Filesystem} from "@littlemissrobot/highfive";
import {chromium, type Page} from "playwright";
import UrlIdGenerator from "./UrlIdGenerator";

export default class Screenshotter {

    private urlIdGenerator: UrlIdGenerator;
    private filesystem: Filesystem;

    constructor(
        urlIdGenerator: UrlIdGenerator,
        filesystem: Filesystem
    ) {
        this.urlIdGenerator = urlIdGenerator;
        this.filesystem = filesystem;
    }

    public async start(urls: string[], runId: string) {

        const browser = await chromium.launch({ headless: true });

        try {
            const context = await browser.newContext({
                viewport: { width: 1440, height: 900 },
                deviceScaleFactor: 1,
            });

            for (const url of urls) {
                const page = await context.newPage();

                try {
                    await page.goto(url, {
                        waitUntil: 'load',
                        timeout: 30_000,
                    });
                    await page.evaluate(() => document.fonts.ready);
                    await this.settle(page);
                    const path = `runs/run-${runId}/${this.urlIdGenerator.generate(url)}.png`;
                    const screenshot = await page.screenshot({
                        fullPage: true,
                        animations: 'disabled',
                    });

                    await this.filesystem.write(path, screenshot);

                    console.log(`Saved ${url} → ${path}`);

                } catch (error) {

                    console.error(`Failed to capture ${url}:`, error);

                } finally {

                    await page.close();
                }
            }
        } finally {
            await browser.close();
        }
    }

    private async settle(page: Page): Promise<void> {
        await page.evaluate(`
        (async () => {
            const wait = (durationMs) => new Promise((resolve) => {
                setTimeout(resolve, durationMs);
            });

            const step = window.innerHeight;
            let y = 0;

            while (y < document.documentElement.scrollHeight) {
                window.scrollTo(0, y);
                y += step;
                await wait(100);
            }

            window.scrollTo(0, 0);

            await Promise.all(
                Array.from(document.images).map(async (image) => {
                    image.loading = 'eager';

                    if (image.complete && image.naturalWidth > 0) {
                        return;
                    }

                    try {
                        await image.decode();
                    } catch {
                        // A broken image should not abort the screenshot.
                    }
                })
            );
        })()
    `);
    }
}