import { Alert, Anchor, Button, Group, Stack, Text, Title } from '@mantine/core';
import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { activityLabel, formatTime, isActive } from '../../format';
import type { Run } from '../../types';
import { BaselineBadge } from '../entities/BaselineBadge';
import { RunStatusBadge } from '../entities/RunStatusBadge';

type Props = {
    run: Run;
    approved: boolean;
    error: string | null;
    approving: boolean;
    onApprove: (event: FormEvent<HTMLFormElement>) => void;
};

export function RunHeader({ run, approved, error, approving, onApprove }: Props) {
    return (
        <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
                <Title order={1}>
                    <Anchor href={run.url} target="_blank" rel="noreferrer">{run.url}</Anchor>
                </Title>
                <Group gap="xs">
                    <RunStatusBadge run={run} />
                    {approved ? <BaselineBadge>Approved baseline</BaselineBadge> : null}
                    <Text component="time" dateTime={run.createdAt} size="sm" c="dimmed">
                        {formatTime(run.createdAt)}
                    </Text>
                </Group>
                <BaselineNote run={run} />
                {isActive(run.status) ? (
                    <Text c="dimmed">{activityLabel(run) ?? 'Live updates until the run finishes.'}</Text>
                ) : null}
                {run.error ? <Alert color="red" role="alert">{run.error}</Alert> : null}
                {error ? <Alert color="red" role="alert">{error}</Alert> : null}
            </Stack>
            {!approved && run.status === 'complete' ? (
                <form onSubmit={onApprove}>
                    <Button type="submit" loading={approving}>Approve as baseline</Button>
                </form>
            ) : null}
        </Group>
    );
}

function BaselineNote({ run }: { run: Run }) {
    if (!run.baselineRunId || run.status !== 'complete') {
        return null;
    }

    if (run.baselineRunId === run.id) {
        return (
            <Text c="dimmed">
                This run is the approved baseline, so the diff compares it with itself.
            </Text>
        );
    }

    return (
        <Text c="dimmed">
            Compared with baseline{' '}
            <Anchor component={Link} to={`/runs/${run.baselineRunId}`}>{run.baselineRunId}</Anchor>.
        </Text>
    );
}
