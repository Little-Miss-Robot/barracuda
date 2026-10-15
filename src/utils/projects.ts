import {ProjectError} from "../errors/ProjectError";
import {Resolution} from "../entities/Resolution";

export const DEFAULT_RESOLUTIONS: Resolution[] = [
    { width: 1440, height: 900 },
];

export type ProjectWrite = {
    url: unknown;
    name?: unknown;
    resolutions?: unknown;
    extraUrls?: unknown;
    screenshotScript?: unknown;
};

export type ProjectPatch = {
    name?: unknown;
    resolutions?: unknown;
    extraUrls?: unknown;
    screenshotScript?: unknown;
};

export const runIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;

export function resolutionsOf(resolutions: Resolution[] | undefined): Resolution[] {
    if (resolutions && resolutions.length > 0) {
        return resolutions;
    }

    return defaultResolutions();
}

export function mergeUrls(scraped: string[], extra: string[]): string[] {
    const seen = new Set(scraped);
    const merged = [...scraped];

    for (const value of extra) {
        let href: string;

        try {
            const url = new URL(value);

            if (!['http:', 'https:'].includes(url.protocol)) {
                continue;
            }

            url.hash = '';
            href = url.href;
        } catch {
            continue;
        }

        if (seen.has(href)) {
            continue;
        }

        seen.add(href);
        merged.push(href);
    }

    return merged;
}

export function defaultResolutions(): Resolution[] {
    return DEFAULT_RESOLUTIONS.map((resolution) => ({ ...resolution }));
}

export function parseHttpUrl(value: string): URL {
    let parsed: URL;

    try {
        parsed = new URL(value.trim());
    } catch {
        throw new ProjectError('Enter a valid HTTP or HTTPS URL.', 400);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new ProjectError('Enter a valid HTTP or HTTPS URL.', 400);
    }

    parsed.hash = '';

    return parsed;
}

export function readName(value: unknown): string {
    if (typeof value !== 'string') {
        throw new ProjectError('Enter a project name.', 400);
    }

    const name = value.trim();

    if (!name) {
        throw new ProjectError('Enter a project name.', 400);
    }

    if (name.length > 120) {
        throw new ProjectError('Use a project name of 120 characters or fewer.', 400);
    }

    return name;
}

export function readResolutions(value: unknown): Resolution[] {
    if (!Array.isArray(value) || value.length === 0) {
        throw new ProjectError('Choose at least one resolution.', 400);
    }

    if (value.length > 8) {
        throw new ProjectError('A project can store up to 8 resolutions.', 400);
    }

    const seen = new Set<string>();

    return value.map((item) => {
        if (!item || typeof item !== 'object') {
            throw new ProjectError('Each resolution needs a width and a height.', 400);
        }

        const width = (item as { width?: unknown }).width;
        const height = (item as { height?: unknown }).height;

        if (!isDimension(width) || !isDimension(height)) {
            throw new ProjectError('Resolution width and height must be whole numbers from 1 to 8192.', 400);
        }

        const key = `${width}x${height}`;

        if (seen.has(key)) {
            throw new ProjectError('Each resolution can only be listed once.', 400);
        }

        seen.add(key);

        return { width, height };
    });
}

export function readExtraUrls(value: unknown): string[] {
    if (!Array.isArray(value)) {
        throw new ProjectError('Extra URLs must be a list.', 400);
    }

    if (value.length > 100) {
        throw new ProjectError('A project can store up to 100 extra URLs.', 400);
    }

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const item of value) {
        if (typeof item !== 'string') {
            throw new ProjectError('Each extra URL must be an HTTP or HTTPS URL.', 400);
        }

        const href = parseHttpUrl(item).href;

        if (seen.has(href)) {
            continue;
        }

        seen.add(href);
        urls.push(href);
    }

    return urls;
}

export function readScreenshotScript(value: unknown): string {
    if (typeof value !== 'string') {
        throw new ProjectError('The screenshot script must be text.', 400);
    }

    if (value.length > 20_000) {
        throw new ProjectError('Use a screenshot script of 20,000 characters or fewer.', 400);
    }

    return value.trim();
}

export function isDimension(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 8192;
}
