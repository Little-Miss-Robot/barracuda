import type {Resolution} from "./Resolution";
import {RunStatus} from "./RunStatus";
import {PageComparison} from "./PageComparison";

export type Run = {
    id: string
    url: string
    urlId: string
    urlIds: string[]
    urls: string[]
    resolutions: Resolution[]
    failures: {url: string, message: string}[]
    pending: string[]
    status: RunStatus
    error?: string
    createdAt: string
    baselineRunId?: string
    comparisons: PageComparison[]
};