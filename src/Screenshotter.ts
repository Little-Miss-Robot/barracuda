import {Filesystem} from "@littlemissrobot/highfive";
import {chromium, type Page} from "playwright";
import {screenshotPath} from "./utils/screenshots";
import UrlIdGenerator from "./UrlIdGenerator";
import {Resolution} from "./entities/Resolution";

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

    public async start(urls: string[], runId: string, resolutions: Resolution[], screenshotScript = '') {

        const browser = await chromium.launch({ headless: true });

        try {
            for (const resolution of resolutions) {
                const context = await browser.newContext({
                    viewport: { width: resolution.width, height: resolution.height },
                    deviceScaleFactor: 1,
                });

                try {
                    for (const url of urls) {
                        const page = await context.newPage();

                        try {
                            await page.goto(url, {
                                waitUntil: 'load',
                                timeout: 30_000,
                            });
                            await page.evaluate(() => document.fonts.ready);
                            await this.settle(page);
                            await this.inject(page, screenshotScript);
                            const path = screenshotPath(runId, this.urlIdGenerator.generate(url), resolution);
                            const screenshot = await page.screenshot({
                                fullPage: true,
                                animations: 'disabled',
                            });

                            await this.filesystem.write(path, screenshot);

                            console.log(`Saved ${url} at ${resolution.width}x${resolution.height} → ${path}`);

                        } catch (error) {

                            console.error(`Failed to capture ${url}:`, error);

                        } finally {

                            await page.close();
                        }
                    }
                } finally {
                    await context.close();
                }
            }
        } finally {
            await browser.close();
        }
    }

    private async inject(page: Page, screenshotScript: string): Promise<void> {
        const source = screenshotScript.trim();

        if (!source) {
            return;
        }

        await page.evaluate(`(async () => {\n${source}\n})()`);
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