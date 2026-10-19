import type {ListedRun} from "./ListedRun";
import type {Capture} from "./Capture";

export type RunEventMap = {
    run: ListedRun,
    screenshot: Capture
};