# Barracuda

Barracuda crawls a site, screenshots each page, and compares the result with the approved baseline 
for that site. Review the diffs in a local web UI, then approve a run when it should become the new baseline.

## Requirements

- Node.js and npm
- Chromium for Playwright

Install dependencies and the browser:

```sh
npm install
npx playwright install chromium
```

Captured runs are written to `storage/`, which is gitignored.

## Run the server

```sh
npm run serve
```

The React UI uses the server API. In another terminal, from the repository root:

```sh
npm run ui
```

Open http://localhost:5173. The dev server proxies `/api` and screenshot requests to the Express server, so `npm run serve` has to be running first.

From the home page, enter an `http` or `https` URL and start a run. The run page refreshes until the crawl and screenshots 
finish. A run can take several minutes because each page is loaded in a headless browser.

On a finished run you can:

- Compare each page side by side, or as an overlay with a slider.
- Read the difference percentage, the changed-pixel count, and the red diff image.
- See pages that failed during the crawl, and pages that were discovered after the page limit.
- Approve the run. That run becomes the baseline for later runs of the same starting URL.

The first completed run of a site is approved automatically, so its diff compares the run with itself. Later runs compare against the approved baseline. Approving another run replaces that baseline. Older runs keep the comparison they had when they finished.

`npm start` runs one crawl from the command line. The starting URL is hardcoded in `src/index.ts`. `npm run dev` restarts that command when the source changes.

## What a run does

1. Crawl internal links on the same origin, starting from the URL you entered. Fragments are ignored. The crawl stops after 100 pages (`maxPages` in `src/container.ts`). Further links are stored as pending and are not screenshotted.
2. Screenshot every crawled page.
3. Compare those screenshots with the baseline and write a diff image per page.

Each page is opened at 1440×900 in headless Chromium, with a 30 second navigation timeout. Before the screenshot, 
Barracuda waits for the document load event and for web fonts, scrolls the page so lazy-loaded images can start loading, 
then waits for those images to decode. CSS animations are disabled. The screenshot is the full page, not just the viewport.

A page that fails to load is listed under scrape failures and is still included in the crawl result. A page that 
fails during the screenshot is logged and skipped; the comparison then reports that a screenshot is missing.

## How differences are measured

Comparison uses [pixelmatch](https://github.com/mapbox/pixelmatch) with a color threshold of `0.1`. Anti-aliased pixels are not counted. A page is 
unchanged only when the changed-pixel count is zero.

Screenshots of the same page often differ in height. Barracuda still compares them: the shared rectangle is 
compared normally, and every pixel that exists in only one image is counted as a change and drawn in red. 
The score is the changed pixels divided by the pixels that exist in either image.

## Where files are stored

Everything lives under `storage/`:

| Path | Contents |
| --- | --- |
| `run-data/<run-id>.json` | Run record: URL, status, failures, pending URLs, and comparison scores |
| `ids/<site-id>_current.json` | Run id of the approved baseline for that starting URL |
| `ids/<site-id>_last.json` | Run id of the most recent run for that starting URL |
| `runs/run-<run-id>/<page-id>.png` | Full-page screenshot |
| `diffs/<run-id>/diff-<page-id>.png` | Diff image for that page |

The site id and page id are slugs derived from the URL hostname, port, path, and query string.

Runs saved before comparison scores were stored get those scores the first time you open them. That pass can take several seconds.

## Project layout

The app is TypeScript, executed directly with `tsx`. There is no compile step.

| Path | Role |
| --- | --- |
| `src/index.ts` | Command-line entry |
| `src/server.ts` | HTTP server entry |
| `src/http/` | Express routes and HTML |
| `public/` | CSS and the small script for the diff view |
| `src/container.ts` | Wiring, including the page limit |
| `src/VisRegTester.ts` | Creates a run, crawls, screenshots, compares, and approves baselines |
| `src/UrlScraper.ts` | Same-origin crawl |
| `src/Screenshotter.ts` | Playwright screenshots |
| `src/RunComparer.ts` | Pairs pages and writes diff images |
| `src/PixelImageComparator.ts` | Pixel comparison |

The UI is not authenticated. It is meant to run on your machine.
