import {Filesystem} from "@littlemissrobot/highfive";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {PixelImageComparator} from "./PixelImageComparator";
import {Run} from "./VisRegTester";

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

    public async compare(runAId: string, runBId: string) {

        const runA = await this.runStorage.get(runAId);
        const runB = await this.runStorage.get(runBId);

        if (! runA || ! runB) {
            throw new Error('One of the runs could not be found');
        }

        const secondSet = new Set(runB.urlIds);
        const urlIds = runA.urlIds.filter(value => secondSet.has(value));

        for (let i = 0; i < urlIds.length; i++) {
            const urlId = urlIds[i];

            const [before, after] = await Promise.all([
                this.filesystem.read(`runs/run-${runAId}/${urlId}.png`),
                this.filesystem.read(`runs/run-${runBId}/${urlId}.png`),
            ]);

            const result = this.imageComparer.compare(before, after);

            console.log(`Difference: ${result.score.toFixed(2)}%`);
            console.log(`Changed pixels: ${result.differentPixels}`);

            await this.filesystem.write(`diffs/${runBId}/diff-${urlId}.png`, result.diffImage);
        }
    }
}