import { Chip, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { comparisonSummary, label, sortComparisons } from '../../format';
import type { ComparisonStatus, Run } from '../../types';
import { ComparisonCard } from './ComparisonCard';

type ViewMode = 'side' | 'overlay';
type ComparisonFilter = 'all' | ComparisonStatus;

const filters: ComparisonFilter[] = ['all', 'changed', 'added', 'removed', 'unchanged', 'error'];

export function Comparisons({ run }: { run: Run }) {
    const [mode, setMode] = useState<ViewMode>('side');
    const [filter, setFilter] = useState<ComparisonFilter>('all');

    if (run.comparisons.length === 0) {
        if (run.status === 'complete') {
            return (
                <Stack gap="sm">
                    <Title order={2}>Diffs</Title>
                    <Text c="dimmed">No pages were captured.</Text>
                </Stack>
            );
        }

        return null;
    }

    const ordered = sortComparisons(run.comparisons);
    const visible = filter === 'all' ? ordered : ordered.filter((comparison) => comparison.status === filter);
    const counts = new Map<ComparisonFilter, number>([['all', ordered.length]]);

    for (const comparison of ordered) {
        counts.set(comparison.status, (counts.get(comparison.status) ?? 0) + 1);
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Title order={2}>Diffs</Title>
                <SegmentedControl
                    value={mode}
                    onChange={(value) => setMode(value as ViewMode)}
                    data={[
                        { label: 'Side by side', value: 'side' },
                        { label: 'Overlay', value: 'overlay' },
                    ]}
                    aria-label="Diff layout"
                />
            </Group>
            <Chip.Group value={filter} onChange={(value) => setFilter(value as ComparisonFilter)}>
                <Group gap="xs" aria-label="Filter pages">
                    {filters.map((status) => {
                        const count = counts.get(status) ?? 0;

                        return (
                            <Chip
                                key={status}
                                value={status}
                                disabled={status !== 'all' && count === 0}
                            >
                                {status === 'all' ? 'All' : label(status)} {count}
                            </Chip>
                        );
                    })}
                </Group>
            </Chip.Group>
            <Text c="dimmed">
                Changed pages are listed first. {comparisonSummary(ordered)} Red marks changed pixels. The overlay slider fades this run over the baseline.
            </Text>
            {visible.length === 0 ? <Text c="dimmed">No pages match this filter.</Text> : null}
            {visible.map((comparison) => (
                <ComparisonCard
                    key={`${comparison.urlId}-${comparison.resolution?.width ?? 0}x${comparison.resolution?.height ?? 0}`}
                    run={run}
                    comparison={comparison}
                    mode={mode}
                />
            ))}
        </Stack>
    );
}
