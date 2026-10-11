import {Resolution} from "./Resolution";

export type PageComparison = {
    urlId: string
    url: string
    resolution?: Resolution
    status: 'unchanged' | 'changed' | 'added' | 'removed' | 'error'
    score?: number
    differentPixels?: number
    message?: string
};