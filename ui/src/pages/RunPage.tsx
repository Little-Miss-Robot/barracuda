import { Stack } from '@mantine/core';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, approveRun, getRun, messageFrom } from '../api';
import { Comparisons } from '../components/comparisons/Comparisons';
import { Crumbs } from '../components/Crumbs';
import { PendingUrls, ScrapeFailures } from '../components/run/RunIssues';
import { RunHeader } from '../components/run/RunHeader';
import { ErrorAlert, LoadingState, MissingResource } from '../components/Status';
import { isActive } from '../format';
import type { ListedRun } from '../types';

export function RunPage() {
    const { runId = '' } = useParams();
    const [details, setDetails] = useState<ListedRun | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [missing, setMissing] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        getRun(runId)
            .then((next) => {
                if (cancelled) {
                    return;
                }

                setDetails(next);
                setMissing(false);
                setError(null);
            })
            .catch((reason: unknown) => {
                if (cancelled) {
                    return;
                }

                if (reason instanceof ApiError && reason.status === 404) {
                    setMissing(true);
                    return;
                }

                setError(messageFrom(reason));
            });

        return () => {
            cancelled = true;
        };
    }, [runId]);

    const status = details?.run.status;

    useEffect(() => {
        if (!status || !isActive(status)) {
            return;
        }

        const timer = window.setInterval(() => {
            getRun(runId)
                .then((next) => {
                    setDetails(next);
                    setError(null);
                })
                .catch((reason: unknown) => {
                    if (reason instanceof ApiError && reason.status === 404) {
                        setMissing(true);
                        return;
                    }

                    setError(messageFrom(reason));
                });
        }, 2000);

        return () => window.clearInterval(timer);
    }, [runId, status]);

    useEffect(() => {
        document.title = `${details?.run.url ?? (missing ? 'Not found' : 'Run')} · Barracuda`;
    }, [details, missing]);

    if (missing) {
        return (
            <MissingResource
                title="Not found"
                message="That run could not be found."
            />
        );
    }

    if (!details) {
        return error
            ? <ErrorAlert message={error} />
            : <LoadingState label="Loading run…" />;
    }

    const { run, approved } = details;

    async function onApprove(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApproving(true);
        setError(null);

        try {
            setDetails(await approveRun(runId));
        } catch (reason) {
            setError(messageFrom(reason));
        } finally {
            setApproving(false);
        }
    }

    return (
        <Stack gap="lg">
            <Crumbs
                items={[
                    { label: 'Projects', to: '/' },
                    { label: run.url, to: `/projects/${run.urlId}` },
                ]}
            />
            <RunHeader
                run={run}
                approved={approved}
                error={error}
                approving={approving}
                onApprove={onApprove}
            />
            <Comparisons run={run} />
            <ScrapeFailures run={run} />
            <PendingUrls run={run} />
        </Stack>
    );
}
