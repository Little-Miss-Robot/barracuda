import { Alert, Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import { formatResolution } from '../../format';
import type { PageComparison, Run } from '../../types';
import { ComparisonStatusBadge } from '../entities/ComparisonStatusBadge';
import { ScreenshotFrames } from './ScreenshotFrames';

type Mode = 'side' | 'overlay';

type Props = {
    run: Run;
    comparison: PageComparison;
    mode: Mode;
};

export function ComparisonCard({ run, comparison, mode }: Props) {
    const score = comparison.score === undefined
        ? null
        : `${comparison.score.toFixed(2)}% · ${comparison.differentPixels ?? 0} pixels`;

    return (
        <Paper withBorder p="md">
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                    <Anchor href={comparison.url} target="_blank" rel="noreferrer">
                        {comparison.url}
                    </Anchor>
                    <Group gap="xs">
                        <ComparisonStatusBadge status={comparison.status} />
                        {comparison.resolution ? (
                            <Text size="sm" c="dimmed">{formatResolution(comparison.resolution)}</Text>
                        ) : null}
                    </Group>
                </Group>
                {score ? <Text size="sm">{score}</Text> : null}
                {comparison.message ? <Alert color="red">{comparison.message}</Alert> : null}
                <ScreenshotFrames run={run} comparison={comparison} mode={mode} />
            </Stack>
        </Paper>
    );
}
