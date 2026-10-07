import { chromium } from 'playwright';

export interface ScraperOptions {
    maxPages?: number;
    timeout?: number;

    // For websites that render their links asynchronously.
    readySelector?: string;
}

export interface ScraperResult {
    urls: string[];
    failures: Array<{ url: string; message: string }>;
    pending: string[];
}

export class UrlScraper {

    private readonly options: ScraperOptions;

    constructor(options: ScraperOptions = {}) {
        this.options = options;
    }

    public async scrape(startUrl: string): Promise<ScraperResult> {
        const start = new URL(startUrl);

        if (!['http:', 'https:'].includes(start.protocol)) {
            throw new Error('The starting URL must use HTTP or HTTPS.');
        }

        start.hash = '';

        const maxPages = this.options.maxPages ?? 100;
        const timeout = this.options.timeout ?? 30_000;

        if (!Number.isInteger(maxPages) || maxPages < 1) {
            throw new Error('maxPages must be a positive integer.');
        }

        const queue = [start.href];
        const discovered = new Set<string>(queue);
        const attempted = new Set<string>();
        const failures: ScraperResult['failures'] = [];

        const browser = await chromium.launch({ headless: true });

        try {
            const context = await browser.newContext();

            for (
                let index = 0;
                index < queue.length && attempted.size < maxPages;
                index++
            ) {
                const url = queue[index]!;
                attempted.add(url);

                const page = await context.newPage();

                try {
                    const response = await page.goto(url, {
                        waitUntil: 'load',
                        timeout,
                    });

                    if (response && !response.ok()) {
                        throw new Error(`HTTP ${response.status()}`);
                    }

                    // Don't extract links after a redirect to another origin.
                    if (new URL(page.url()).origin !== start.origin) {
                        continue;
                    }

                    const contentType =
                        response?.headers()['content-type'] ?? '';

                    if (
                        contentType &&
                        !contentType.includes('text/html') &&
                        !contentType.includes('application/xhtml+xml')
                    ) {
                        continue;
                    }

                    if (this.options.readySelector) {
                        await page.locator(this.options.readySelector).waitFor({
                            state: 'attached',
                            timeout,
                        });
                    }

                    // Reading .href resolves relative URLs and <base> tags.
                    const links = await page
                        .locator('a[href]')
                        .evaluateAll((elements) =>
                            elements.map(
                                (element) => (element as HTMLAnchorElement).href,
                            ),
                        );

                    for (const link of links) {
                        const internalUrl = this.normalize(link, start.origin);

                        if (!internalUrl || discovered.has(internalUrl)) {
                            continue;
                        }

                        discovered.add(internalUrl);
                        queue.push(internalUrl);
                    }
                } catch (error) {
                    failures.push({
                        url,
                        message:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                } finally {
                    await page.close();
                }
            }
        } finally {
            await browser.close();
        }

        return {
            urls: [...attempted],
            failures,
            pending: queue.filter((url) => !attempted.has(url)),
        };
    }

    private normalize(value: string, origin: string): string | null {
        try {
            const url = new URL(value);

            if (
                !['http:', 'https:'].includes(url.protocol) ||
                url.origin !== origin
            ) {
                return null;
            }

            url.hash = '';

            return url.href;
        } catch {
            return null;
        }
    }
}