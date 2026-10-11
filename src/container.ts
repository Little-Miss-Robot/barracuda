import {
    DefaultContainer, Filesystem,
    identifiersProvider,
} from "@littlemissrobot/highfive";
import Screenshotter from "./Screenshotter";
import {LocalFilesystem} from "./LocalFilesystem";
import {UrlScraper} from "./UrlScraper";
import {Project, Projects} from "./Project";
import {Run, VisRegTester} from "./VisRegTester";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {FilesystemKeyValueStore} from "./FilesystemKeyValueStore";
import UrlIdGenerator from "./UrlIdGenerator";
import {RunComparer} from "./RunComparer";
import {PixelImageComparator} from "./PixelImageComparator";
import {ListingFilesystem} from "./contracts/ListingFilesystem";

const container = new DefaultContainer<{
    filesystem: () => Filesystem & ListingFilesystem,
    runStorage: () => KeyValueStore<Run>,
    projectStorage: () => KeyValueStore<Project>,
    projects: () => Projects,
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
    .singleton('projectStorage', () => {
        return new FilesystemKeyValueStore<Project>(
            container.make('filesystem'), 'projects'
        );
    })
    .singleton('projects', () => {
        return new Projects(
            container.make('projectStorage'),
            container.make('runStorage'),
            container.make('idStorage'),
            container.make('filesystem'),
            container.make('urlIdGenerator'),
        );
    })
    .bind('urlScraper', () => {
        return new UrlScraper({
            maxPages: 100
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
            container.make('runComparer'),
            container.make('projects'),
        );
    });

export default container;