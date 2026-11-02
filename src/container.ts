import {
    clockProvider,
    DefaultContainer, EventBus, Filesystem,
    identifiersProvider, InMemoryEventBus, loggerProvider,
} from "@littlemissrobot/highfive";
import Screenshotter from "./Screenshotter";
import {LocalFilesystem} from "./LocalFilesystem";
import {UrlScraper} from "./UrlScraper";
import {VisRegTester} from "./VisRegTester";
import {KeyValueStore} from "./contracts/KeyValueStore";
import {FilesystemKeyValueStore} from "./FilesystemKeyValueStore";
import UrlIdGenerator from "./UrlIdGenerator";
import {RunComparer} from "./RunComparer";
import {PixelImageComparator} from "./PixelImageComparator";
import {ListingFilesystem} from "./contracts/ListingFilesystem";
import {Project} from "./entities/Project";
import {ProjectRepository} from "./ProjectRepository";
import {Run} from "./entities/Run";
import FileLogger from "./FileLogger";
import {RunEventMap} from "./entities/RunEventMap";

const container = new DefaultContainer<{
    filesystem: () => Filesystem & ListingFilesystem,
    runStorage: () => KeyValueStore<Run>,
    projectStorage: () => KeyValueStore<Project>,
    projects: () => ProjectRepository,
    idStorage: () => KeyValueStore<string>,
    urlIdGenerator: () => UrlIdGenerator,
    tester: () => VisRegTester,
    screenshotter: () => Screenshotter,
    urlScraper: () => UrlScraper,
    runComparer: () => RunComparer,
    imageComparer: () => PixelImageComparator,
    runEvents: () => EventBus<RunEventMap>,
}>()
    .register(clockProvider)
    .register(loggerProvider)
    .register(identifiersProvider);

    container.singleton('imageComparer', () => {
        return new PixelImageComparator();
    })
    .singleton('logger', () => {
        return new FileLogger(
            container.make('filesystem')
        );
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
        return new ProjectRepository(
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
            container.make('imageComparer'),
            container.make('logger')
        );
    })
    .singleton('runEvents', () => {
        return new InMemoryEventBus<RunEventMap>();
    })
    .bind('screenshotter', () => {
        return new Screenshotter(
            container.make('urlIdGenerator'),
            container.make('filesystem'),
            container.make('logger')
        );
    })
    .singleton('tester', () => {
        return new VisRegTester(
            container.make('idGenerator'),
            container.make('urlIdGenerator'),
            container.make('urlScraper'),
            container.make('screenshotter'),
            container.make('runStorage'),
            container.make('idStorage'),
            container.make('runComparer'),
            container.make('projects'),
            container.make('runEvents'),
            container.make('filesystem'),
        );
    });

export default container;