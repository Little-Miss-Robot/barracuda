import {Card, Group, Stack, Text} from '@mantine/core';
import { Link } from 'react-router-dom';
import {activityLabel, changeCount, formatChangeCount, formatTime} from '../../format';
import type { ListedRun, Project } from '../../types';
import { BaselineBadge } from './BaselineBadge';
import { RunStatusBadge } from './RunStatusBadge';
import RunChart from "./RunChart";
import RunThumbnail from "./RunThumbnail";

type Props = {
    project: Project;
    latestRun?: ListedRun;
};

export function ProjectCard({ project, latestRun }: Props) {
    const changes = latestRun ? changeCount(latestRun.run) : null;

    return (
        <Card shadow="sm" padding="lg" h="100%" component={Link} to={`/projects/${project.urlId}`}>
            <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={600}>
                        {project.name}
                    </Text>
                    <Group gap="xs">
                        {latestRun?.approved ? <BaselineBadge /> : null}
                        {latestRun ? <RunStatusBadge run={latestRun.run} /> : null}
                    </Group>
                </Group>
                <Text size="sm" c="dimmed">
                    {project.url}
                </Text>
                {latestRun && (
                    <>
                        <RunThumbnail run={latestRun.run} />
                        <RunChart run={latestRun.run} />
                    </>
                )}
                <Text size="sm" component="div">
                    {latestRun ? (
                        <>
                            {formatTime(latestRun.run.createdAt)}
                            {' · '}
                            {activityLabel(latestRun.run) ?? (changes === null ? 'No comparison yet' : formatChangeCount(changes))}
                        </>
                    ) : 'No runs yet'}
                </Text>
            </Stack>
        </Card>
    );
}
