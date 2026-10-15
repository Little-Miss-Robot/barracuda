import type {Resolution} from "./Resolution";

export type CaptureStatus = 'captured' | 'failed';

export type Capture = {
    url: string
    urlId: string
    resolution: Resolution
    status: CaptureStatus
    message?: string
};
