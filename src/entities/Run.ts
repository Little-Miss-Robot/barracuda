import type {Capture} from "./Capture";
import type {PageComparison} from "./PageComparison";
import type {Resolution} from "./Resolution";
import type {RunActivity} from "./RunActivity";
import type {RunStatus} from "./RunStatus";

export type Run = {
    id: string;
    url: string;
    urlId: string;
    urlIds: string[];
    urls: string[];
    resolutions?: Resolution[];
    failures: { url: string; message: string }[];
    pending: string[];
    captures?: Capture[];
    activity?: RunActivity;
    status: RunStatus;
    error?: string;
    createdAt: string;
    baselineRunId?: string;
    comparisons: PageComparison[];
};