import {Resolution} from "../entities/Resolution";

const DEFAULT_WIDTH = 1440;
const DEFAULT_HEIGHT = 900;

export function isDefaultResolution(resolution: Resolution): boolean {
    return resolution.width === DEFAULT_WIDTH && resolution.height === DEFAULT_HEIGHT;
}

export function screenshotPath(runId: string, urlId: string, resolution: Resolution): string {
    return `runs/run-${runId}/${urlId}-${resolution.width}x${resolution.height}.png`;
}

export function legacyScreenshotPath(runId: string, urlId: string): string {
    return `runs/run-${runId}/${urlId}.png`;
}

export function diffPath(runId: string, urlId: string, resolution: Resolution): string {
    return `diffs/${runId}/diff-${urlId}-${resolution.width}x${resolution.height}.png`;
}

export function legacyDiffPath(runId: string, urlId: string): string {
    return `diffs/${runId}/diff-${urlId}.png`;
}

export function screenshotCandidates(
    runId: string,
    urlId: string,
    resolution: Resolution | undefined,
    kind: 'images' | 'diffs',
): string[] {
    if (!resolution) {
        return [kind === 'images' ? legacyScreenshotPath(runId, urlId) : legacyDiffPath(runId, urlId)];
    }

    const sized = kind === 'images'
        ? screenshotPath(runId, urlId, resolution)
        : diffPath(runId, urlId, resolution);

    if (!isDefaultResolution(resolution)) {
        return [sized];
    }

    const legacy = kind === 'images'
        ? legacyScreenshotPath(runId, urlId)
        : legacyDiffPath(runId, urlId);

    return [sized, legacy];
}
