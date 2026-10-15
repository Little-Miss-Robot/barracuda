import { Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { listRuns, messageFrom } from '../api';
import { RunsTable } from '../components/entities/RunsTable';
import { ErrorAlert } from '../components/Status';
import type { ListedRun } from '../types';
import { useLiveRuns } from '../useLiveRuns';

export function RunsPage() {
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Runs · Barracuda';
    }, []);

    useLiveRuns(runs, setRuns);

    useEffect(() => {
        let cancelled = false;

        listRuns()
            .then((nextRuns) => {
                if (cancelled) {
                    return;
                }

                setRuns(nextRuns);
                setError(null);
            })
            .catch((reason: unknown) => {
                if (!cancelled) {
                    setError(messageFrom(reason));
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Stack gap="lg">
            <Stack gap="xs">
                <Title order={1}>Runs</Title>
            </Stack>
            <ErrorAlert message={error} />
            {runs === null && !error ? <Text c="dimmed">Loading runs…</Text> : null}
            {runs ? <RunsTable runs={runs} empty="No runs yet." showUrl /> : null}
        </Stack>
    );
}
