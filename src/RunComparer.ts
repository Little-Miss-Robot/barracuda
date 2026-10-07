import {Filesystem} from "@littlemissrobot/highfive";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {PixelImageComparator} from "./PixelImageComparator";
import {PageComparison, Run} from "./VisRegTester";

export class RunComparer {

    private readonly filesystem: Filesystem;
    private readonly runStorage: KeyValueStore<Run>;
    private readonly imageComparer: PixelImageComparator;

    constructor(
        filesystem: Filesystem,
        runStorage: KeyValueStore<Run>,
        imageComparer: PixelImageComparator
    ) {
        this.filesystem = filesystem;
        this.runStorage = runStorage;
        this.imageComparer = imageComparer;
    }

    public async compare(runAId: string, runBId: string): Promise<PageComparison[]> {

        const runA = await this.runStorage.get(runAId);
        const runB = await this.runStorage.get(runBId);

        if (! runA || ! runB) {
            throw new Error('One of the runs could not be found');
        }

        const urlsA = new Map(runA.urlIds.map((urlId, index) => [urlId, runA.urls[index] ?? urlId]));
        const urlsB = new Map(runB.urlIds.map((urlId, index) => [urlId, runB.urls[index] ?? urlId]));
        const results: PageComparison[] = [];

        for (const [urlId, url] of urlsB) {
            if (!urlsA.has(urlId)) {
                results.push({ urlId, url, status: 'added' });
                continue;
            }

            results.push(await this.comparePage(runAId, runBId, urlId, url));
        }

        for (const [urlId, url] of urlsA) {
            if (!urlsB.has(urlId)) {
                results.push({ urlId, url, status: 'removed' });
            }
        }

        return results;
    }

    private async comparePage(
        runAId: string,
        runBId: string,
        urlId: string,
        url: string,
    ): Promise<PageComparison> {
        const beforePath = `runs/run-${runAId}/${urlId}.png`;
        const afterPath = `runs/run-${runBId}/${urlId}.png`;

        if (!await this.filesystem.exists(beforePath) || !await this.filesystem.exists(afterPath)) {
            return {
                urlId,
                url,
                status: 'error',
                message: 'One of the screenshots is missing.',
            };
        }

        try {
            const [before, after] = await Promise.all([
                this.filesystem.read(beforePath),
                this.filesystem.read(afterPath),
            ]);

            const result = this.imageComparer.compare(before, after);

            console.log(`Difference: ${result.score.toFixed(2)}%`);
            console.log(`Changed pixels: ${result.differentPixels}`);

            await this.filesystem.write(`diffs/${runBId}/diff-${urlId}.png`, result.diffImage);

            return {
                urlId,
                url,
                status: result.differentPixels === 0 ? 'unchanged' : 'changed',
                score: result.score,
                differentPixels: result.differentPixels,
            };
        } catch (error) {
            return {
                urlId,
                url,
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }
}