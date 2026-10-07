import {Filesystem} from "@littlemissrobot/highfive";
import {chromium} from "playwright";
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

                    // Wait for web fonts to finish loading.
                    await page.evaluate(() => document.fonts.ready);

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
}