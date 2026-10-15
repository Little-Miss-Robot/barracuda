import { Card, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { changeCount, formatChangeCount, formatResolution, formatTime } from '../../format';
import type { ListedRun, Project } from '../../types';
import { BaselineBadge } from './BaselineBadge';
import { RunStatusBadge } from './RunStatusBadge';

type Props = {
    project: Project;
    latestRun?: ListedRun;
};

export function ProjectCard({ project, latestRun }: Props) {
    const changes = latestRun ? changeCount(latestRun.run) : null;

    return (
        <Card shadow="sm" padding="lg" h="100%" component={Link} to={`/projects/${project.urlId}`}>
            <Stack gap="sm" h="100%">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={600}>
                        {project.name}
                    </Text>
                    <Group gap="xs">
                        {latestRun?.approved ? <BaselineBadge /> : null}
                        {latestRun ? <RunStatusBadge run={latestRun.run} /> : null}
                    </Group>
                </Group>
                {project.url}
                <Text size="sm" c="dimmed">
                    {project.resolutions.map(formatResolution).join(', ')}
                </Text>
                <Text size="sm" component="div">
                    {latestRun ? (
                        <>
                            {formatTime(latestRun.run.createdAt)}
                            {' · '}
                            {changes === null ? 'No comparison yet' : formatChangeCount(changes)}
                        </>
                    ) : 'No runs yet'}
                </Text>
            </Stack>
        </Card>
    );
}
