import { Image, SimpleGrid, Stack, Text } from '@mantine/core';
import { imagePath } from '../../format';
import type { PageComparison, Run } from '../../types';
import { OverlaySlider } from './OverlaySlider';

type Mode = 'side' | 'overlay';

type Props = {
    run: Run;
    comparison: PageComparison;
    mode: Mode;
};

export function ScreenshotFrames({ run, comparison, mode }: Props) {
    const current = imagePath(run.id, comparison.urlId, 'images', comparison.resolution);
    const baseline = run.baselineRunId ? imagePath(run.baselineRunId, comparison.urlId, 'images', comparison.resolution) : '';
    const diff = imagePath(run.id, comparison.urlId, 'diffs', comparison.resolution);

    if (comparison.status === 'added') {
        return (
            <SimpleGrid cols={1}>
                <Figure caption="This run" src={current} />
            </SimpleGrid>
        );
    }

    if (comparison.status === 'removed') {
        if (!baseline) {
            return null;
        }

        return (
            <SimpleGrid cols={1}>
                <Figure caption="Baseline" src={baseline} />
            </SimpleGrid>
        );
    }

    if (comparison.status === 'error' || !baseline) {
        return null;
    }

    if (mode === 'overlay') {
        return <OverlaySlider baseline={baseline} current={current} />;
    }

    return (
        <SimpleGrid cols={{ base: 1, md: 3 }}>
            <Figure caption="Baseline" src={baseline} />
            <Figure caption="This run" src={current} />
            <Figure caption="Diff" src={diff} />
        </SimpleGrid>
    );
}

function Figure({ caption, src }: { caption: string; src: string }) {
    return (
        <Stack gap={4}>
            <Text size="sm" fw={500}>{caption}</Text>
            <Image src={src} alt={`${caption} screenshot`} radius="sm" />
        </Stack>
    );
}
