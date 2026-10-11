import {Filesystem} from "@littlemissrobot/highfive";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {PixelImageComparator} from "./PixelImageComparator";
import {resolutionsOf, type Resolution} from "./Project";
import {diffPath, screenshotCandidates} from "./screenshots";
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

        const shotsA = shotsFor(runA);
        const shotsB = shotsFor(runB);
        const results: PageComparison[] = [];

        for (const [key, shot] of shotsB) {
            if (!shotsA.has(key)) {
                results.push({
                    urlId: shot.urlId,
                    url: shot.url,
                    resolution: shot.resolution,
                    status: 'added',
                });
                continue;
            }

            results.push(await this.comparePage(runAId, runBId, shot));
        }

        for (const [key, shot] of shotsA) {
            if (!shotsB.has(key)) {
                results.push({
                    urlId: shot.urlId,
                    url: shot.url,
                    resolution: shot.resolution,
                    status: 'removed',
                });
            }
        }

        return results;
    }

    private async comparePage(
        runAId: string,
        runBId: string,
        shot: Shot,
    ): Promise<PageComparison> {
        const beforePath = await this.findScreenshot(runAId, shot);
        const afterPath = await this.findScreenshot(runBId, shot);

        if (!beforePath || !afterPath) {
            return {
                urlId: shot.urlId,
                url: shot.url,
                resolution: shot.resolution,
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

            await this.filesystem.write(diffPath(runBId, shot.urlId, shot.resolution), result.diffImage);

            return {
                urlId: shot.urlId,
                url: shot.url,
                resolution: shot.resolution,
                status: result.differentPixels === 0 ? 'unchanged' : 'changed',
                score: result.score,
                differentPixels: result.differentPixels,
            };
        } catch (error) {
            return {
                urlId: shot.urlId,
                url: shot.url,
                resolution: shot.resolution,
                status: 'error',
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async findScreenshot(runId: string, shot: Shot): Promise<string | undefined> {
        for (const path of screenshotCandidates(runId, shot.urlId, shot.resolution, 'images')) {
            if (await this.filesystem.exists(path)) {
                return path;
            }
        }

        return undefined;
    }
}

type Shot = {
    urlId: string;
    url: string;
    resolution: Resolution;
};

function shotsFor(run: Run): Map<string, Shot> {
    const shots = new Map<string, Shot>();

    run.urlIds.forEach((urlId, index) => {
        for (const resolution of resolutionsOf(run.resolutions)) {
            shots.set(`${urlId}:${resolution.width}x${resolution.height}`, {
                urlId,
                url: run.urls[index] ?? urlId,
                resolution,
            });
        }
    });

    return shots;
}