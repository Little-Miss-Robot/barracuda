import { Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { listRuns, messageFrom } from '../api';
import { RunsTable } from '../components/entities/RunsTable';
import { ErrorAlert } from '../components/Status';
import { isActive } from '../format';
import type { ListedRun } from '../types';

export function RunsPage() {
    const [runs, setRuns] = useState<ListedRun[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Runs · Barracuda';
    }, []);

    useEffect(() => {
        let cancelled = false;
        let timer = 0;

        const load = () => {
            listRuns()
                .then((nextRuns) => {
                    if (cancelled) {
                        return;
                    }

                    setRuns(nextRuns);
                    setError(null);

                    if (nextRuns.some((item) => isActive(item.run.status))) {
                        timer = window.setTimeout(load, 2000);
                    }
                })
                .catch((reason: unknown) => {
                    if (!cancelled) {
                        setError(messageFrom(reason));
                    }
                });
        };

        load();

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
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
