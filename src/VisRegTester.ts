import type {IdGenerator} from '@littlemissrobot/highfive';
import Screenshotter from "./Screenshotter";
import {UrlScraper} from "./UrlScraper";
import {KeyValueStore} from "./contracts/KeyValueStore";
import UrlIdGenerator from "./UrlIdGenerator";
import {RunComparer} from "./RunComparer";

export type Run = {
    id: string
    urlId: string
    urlIds: string[]
    urls: string[]
    failures: {url: string, message: string}[]
    pending: string[]
};

export class VisRegTester {
    private idGenerator: IdGenerator;
    private urlIdGenerator: UrlIdGenerator;
    private urlScraper: UrlScraper;
    private screenshotter: Screenshotter;
    private runStorage: KeyValueStore<Run>;
    private idStorage: KeyValueStore<string>;
    private runComparer: RunComparer;

    constructor(
        idGenerator: IdGenerator,
        urlIdGenerator: UrlIdGenerator,
        urlScraper: UrlScraper,
        screenshotter: Screenshotter,
        runStorage: KeyValueStore<Run>,
        idStorage: KeyValueStore<string>,
        runComparer: RunComparer
    ) {
        this.idGenerator = idGenerator;
        this.urlIdGenerator = urlIdGenerator;
        this.urlScraper = urlScraper;
        this.screenshotter = screenshotter;
        this.runStorage = runStorage;
        this.idStorage = idStorage;
        this.runComparer = runComparer;
    }

    public async run(url: string) {

        const runId = this.idGenerator.generate();
        const urlId = this.urlIdGenerator.generate(url);

        const result = await this.urlScraper.scrape(url);

        await this.screenshotter.start(result.urls, runId);

        await this.runStorage.set(runId, {
            id: runId,
            urlId,
            urlIds: result.urls.map(this.urlIdGenerator.generate),
            urls: result.urls,
            pending: result.pending,
            failures: result.failures,
        });

        await this.idStorage.set(`${urlId}_last`, runId);

        if (! await this.idStorage.has(`${urlId}_current`)) {
            await this.idStorage.set(`${urlId}_current`, runId);
        }

        const approvedRunId = await this.idStorage.get(`${urlId}_current`);

        if (! approvedRunId) {
            throw new Error('No approved run was found');
        }

        await this.runComparer.compare(
            approvedRunId,
            runId
        );
    }
}