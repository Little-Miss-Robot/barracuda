import {
    DefaultContainer,
    Filesystem,
    identifiersProvider,
} from "@littlemissrobot/highfive";
import Screenshotter from "./Screenshotter";
import {LocalFilesystem} from "./LocalFilesystem";
import {UrlScraper} from "./UrlScraper";
import {Run, VisRegTester} from "./VisRegTester";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {FilesystemKeyValueStore} from "./FilesystemKeyValueStore";
import UrlIdGenerator from "./UrlIdGenerator";
import {RunComparer} from "./RunComparer";
import {PixelImageComparator} from "./PixelImageComparator";

const container = new DefaultContainer<{
    filesystem: () => Filesystem,
    runStorage: () => KeyValueStore<Run>,
    idStorage: () => KeyValueStore<string>,
    urlIdGenerator: () => UrlIdGenerator,
    tester: () => VisRegTester,
    screenshotter: () => Screenshotter,
    urlScraper: () => UrlScraper,
    runComparer: () => RunComparer,
    imageComparer: () => PixelImageComparator,
}>()
    .register(identifiersProvider);

    container.singleton('imageComparer', () => {
        return new PixelImageComparator();
    })
    .singleton('urlIdGenerator', () => {
        return new UrlIdGenerator();
    })
    .singleton('filesystem', () => {
        return new LocalFilesystem('storage');
    })
    .singleton('idStorage', () => {
        return new FilesystemKeyValueStore<string>(
            container.make('filesystem'), 'ids'
        );
    })
    .singleton('runStorage', () => {
        return new FilesystemKeyValueStore<Run>(
            container.make('filesystem'), 'run-data'
        );
    })
    .bind('urlScraper', () => {
        return new UrlScraper({
            maxPages: 10
        });
    })
    .singleton('runComparer', () => {
        return new RunComparer(
            container.make('filesystem'),
            container.make('runStorage'),
            container.make('imageComparer')
        );
    })
    .bind('screenshotter', () => {
        return new Screenshotter(
            container.make('urlIdGenerator'),
            container.make('filesystem'),
        );
    })
    .bind('tester', () => {
        return new VisRegTester(
            container.make('idGenerator'),
            container.make('urlIdGenerator'),
            container.make('urlScraper'),
            container.make('screenshotter'),
            container.make('runStorage'),
            container.make('idStorage'),
            container.make('runComparer')
        );
    });

export default container;