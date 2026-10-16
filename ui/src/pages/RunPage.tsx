import {Button, Group, Tabs, Text} from '@mantine/core';
import {MouseEventHandler} from 'react';
import { useParams } from 'react-router-dom';
import { Comparisons } from '../components/comparisons/Comparisons';
import { PendingUrls, ScrapeFailures } from '../components/run/RunIssues';
import {useWindowTitle} from "../hooks/useWindowTitle";
import {useListedRun} from "../hooks/queries/useListedRun";
import Module from "../components/Module";
import {LoadingState} from "../components/Status";
import {RunStatusBadge} from "../components/entities/RunStatusBadge";
import {BaselineBadge} from "../components/entities/BaselineBadge";
import {formatTime} from "../format";
import {approveRun} from "../api";

export function RunPage() {
    const { runId = '' } = useParams();
    const { run } = useListedRun(runId);

    useWindowTitle(run?.run.id || '');

    const onApprove: MouseEventHandler<HTMLButtonElement> = async () => {
        await approveRun(runId);
    };

    return (
        <Module
            title={run?.run?.id || ''}
            actions={(run && !run.approved) && (
                <Button onClick={onApprove}>Approve as baseline</Button>
            )}
        >
            {!run ? (
                <LoadingState label="Loading run…" />
            ) : (
                <>
                    <Group gap="xs">
                        <RunStatusBadge run={run.run} />
                        {run.approved ? <BaselineBadge>Approved baseline</BaselineBadge> : null}
                        <Text component="time" dateTime={run.run.createdAt} size="sm" c="dimmed">
                            {formatTime(run.run.createdAt)}
                        </Text>
                    </Group>
                    <Tabs defaultValue="diffs">
                        <Tabs.List>
                            <Tabs.Tab value="diffs">
                                Diffs
                            </Tabs.Tab>
                            <Tabs.Tab value="failures">
                                Scrape failures
                            </Tabs.Tab>
                            <Tabs.Tab value="pending">
                                Pending urls
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="diffs" py="lg">
                            <Comparisons run={run.run} />
                        </Tabs.Panel>

                        <Tabs.Panel value="failures" py="lg">
                            <ScrapeFailures run={run.run} />
                        </Tabs.Panel>

                        <Tabs.Panel value="pending" py="lg">
                            <PendingUrls run={run.run} />
                        </Tabs.Panel>
                    </Tabs>
                </>
            )}
        </Module>
    );
}
