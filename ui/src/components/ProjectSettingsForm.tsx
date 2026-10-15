import { ActionIcon, Button, Fieldset, Group, NumberInput, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Project, Resolution } from '../types';
import { ErrorAlert } from './Status';

type ResolutionDraft = {
    width: string;
    height: string;
};

export type ProjectSettingsInput = {
    name: string;
    resolutions: Resolution[];
    extraUrls: string[];
    screenshotScript: string;
};

type Props = {
    project: Project;
    saving: boolean;
    removing: boolean;
    error: string | null;
    onSave: (input: ProjectSettingsInput) => void;
    onRemove: () => void;
};

export function ProjectSettingsForm({ project, saving, removing, error, onSave, onRemove }: Props) {
    const [name, setName] = useState(project.name);
    const [resolutions, setResolutions] = useState<ResolutionDraft[]>(draftResolutions(project));
    const [extraUrls, setExtraUrls] = useState<string[]>(project.extraUrls);
    const [screenshotScript, setScreenshotScript] = useState(project.screenshotScript ?? '');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [confirmingRemove, setConfirmingRemove] = useState(false);

    useEffect(() => {
        setName(project.name);
        setResolutions(draftResolutions(project));
        setExtraUrls(project.extraUrls);
        setScreenshotScript(project.screenshotScript ?? '');
        setValidationError(null);
        setConfirmingRemove(false);
    }, [project]);

    const parsed = readSettings(name, resolutions, extraUrls, screenshotScript);
    const dirty = typeof parsed === 'string' || settingsDiffer(project, parsed);

    function updateResolution(index: number, patch: Partial<ResolutionDraft>) {
        setResolutions((current) => current.map((item, itemIndex) => (
            itemIndex === index ? { ...item, ...patch } : item
        )));
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (typeof parsed === 'string') {
            setValidationError(parsed);
            return;
        }

        setValidationError(null);
        onSave(parsed);
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack gap="md">
                <ErrorAlert message={validationError ?? error} />
                <TextInput
                    label="Name"
                    required
                    value={name}
                    onChange={(event) => setName(event.currentTarget.value)}
                />
                <Fieldset legend="Resolutions">
                    <Stack gap="sm">
                        {resolutions.map((resolution, index) => (
                            <Group key={index} align="flex-end" wrap="nowrap">
                                <NumberInput
                                    aria-label={`Resolution ${index + 1} width`}
                                    min={1}
                                    max={8192}
                                    allowDecimal={false}
                                    value={resolution.width}
                                    onChange={(value) => updateResolution(index, { width: String(value) })}
                                    w={120}
                                />
                                <Text mb={8}>×</Text>
                                <NumberInput
                                    aria-label={`Resolution ${index + 1} height`}
                                    min={1}
                                    max={8192}
                                    allowDecimal={false}
                                    value={resolution.height}
                                    onChange={(value) => updateResolution(index, { height: String(value) })}
                                    w={120}
                                />
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label={`Remove resolution ${index + 1}`}
                                    disabled={resolutions.length === 1}
                                    onClick={() => setResolutions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <TrashIcon size={16} />
                                </ActionIcon>
                            </Group>
                        ))}
                        <Button
                            type="button"
                            variant="default"
                            leftSection={<PlusIcon size={16} />}
                            disabled={resolutions.length >= 8}
                            onClick={() => setResolutions((current) => [...current, { width: '390', height: '844' }])}
                            w="fit-content"
                        >
                            Add resolution
                        </Button>
                    </Stack>
                </Fieldset>
                <Fieldset legend="Extra URLs">
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            These pages are screenshotted in addition to the crawled site.
                        </Text>
                        {extraUrls.map((value, index) => (
                            <Group key={index} align="flex-end" wrap="nowrap">
                                <TextInput
                                    aria-label={`Extra URL ${index + 1}`}
                                    type="url"
                                    placeholder="https://example.com/page"
                                    value={value}
                                    onChange={(event) => setExtraUrls((current) => current.map((item, itemIndex) => (
                                        itemIndex === index ? event.currentTarget.value : item
                                    )))}
                                    flex={1}
                                />
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="lg"
                                    aria-label={`Remove extra URL ${index + 1}`}
                                    onClick={() => setExtraUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <TrashIcon size={16} />
                                </ActionIcon>
                            </Group>
                        ))}
                        <Button
                            type="button"
                            variant="default"
                            leftSection={<PlusIcon size={16} />}
                            disabled={extraUrls.length >= 100}
                            onClick={() => setExtraUrls((current) => [...current, ''])}
                            w="fit-content"
                        >
                            Add URL
                        </Button>
                    </Stack>
                </Fieldset>
                <Textarea
                    label="Screenshot script"
                    description="JavaScript that runs in each page after it loads and before the screenshot. Use it to remove a cookie notice or hide elements that should not appear in the capture."
                    placeholder={"document.querySelector('#cookie-notice')?.remove();"}
                    spellCheck={false}
                    minRows={6}
                    autosize
                    ff="monospace"
                    value={screenshotScript}
                    onChange={(event) => setScreenshotScript(event.currentTarget.value)}
                />
                <Group>
                    <Button type="submit" loading={saving} disabled={!dirty}>
                        Save settings
                    </Button>
                    {confirmingRemove ? (
                        <>
                            <Button type="button" color="red" loading={removing} onClick={onRemove}>
                                Remove project and runs
                            </Button>
                            <Button type="button" variant="default" onClick={() => setConfirmingRemove(false)}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button type="button" variant="default" onClick={() => setConfirmingRemove(true)}>
                            Remove project
                        </Button>
                    )}
                </Group>
            </Stack>
        </form>
    );
}

function draftResolutions(project: Project): ResolutionDraft[] {
    return project.resolutions.map((resolution) => ({
        width: String(resolution.width),
        height: String(resolution.height),
    }));
}

function readSettings(
    name: string,
    resolutions: ResolutionDraft[],
    extraUrls: string[],
    screenshotScript: string,
): ProjectSettingsInput | string {
    const trimmedName = name.trim();

    if (!trimmedName) {
        return 'Enter a project name.';
    }

    if (resolutions.length === 0) {
        return 'Choose at least one resolution.';
    }

    const parsedResolutions: Resolution[] = [];
    const seen = new Set<string>();

    for (const resolution of resolutions) {
        const width = Number(resolution.width);
        const height = Number(resolution.height);

        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192) {
            return 'Resolution width and height must be whole numbers from 1 to 8192.';
        }

        const key = `${width}x${height}`;

        if (seen.has(key)) {
            return 'Each resolution can only be listed once.';
        }

        seen.add(key);
        parsedResolutions.push({ width, height });
    }

    const parsedUrls: string[] = [];
    const seenUrls = new Set<string>();

    for (const value of extraUrls) {
        const trimmed = value.trim();

        if (!trimmed) {
            continue;
        }

        let parsed: URL;

        try {
            parsed = new URL(trimmed);
        } catch {
            return 'Each extra URL must be an HTTP or HTTPS URL.';
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return 'Each extra URL must be an HTTP or HTTPS URL.';
        }

        parsed.hash = '';

        if (seenUrls.has(parsed.href)) {
            continue;
        }

        seenUrls.add(parsed.href);
        parsedUrls.push(parsed.href);
    }

    const script = screenshotScript.trim();

    if (script.length > 20_000) {
        return 'Use a screenshot script of 20,000 characters or fewer.';
    }

    return {
        name: trimmedName,
        resolutions: parsedResolutions,
        extraUrls: parsedUrls,
        screenshotScript: script,
    };
}

function settingsDiffer(project: Project, parsed: ProjectSettingsInput): boolean {
    return parsed.name !== project.name
        || parsed.screenshotScript !== (project.screenshotScript ?? '')
        || parsed.extraUrls.join('\n') !== project.extraUrls.join('\n')
        || parsed.resolutions.length !== project.resolutions.length
        || parsed.resolutions.some((resolution, index) => (
            resolution.width !== project.resolutions[index]?.width
            || resolution.height !== project.resolutions[index]?.height
        ));
}
