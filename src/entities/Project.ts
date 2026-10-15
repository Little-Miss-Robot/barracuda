import {Resolution} from "./Resolution";

export type Project = {
    urlId: string;
    url: string;
    name: string;
    resolutions: Resolution[];
    extraUrls: string[];
    screenshotScript: string;
};