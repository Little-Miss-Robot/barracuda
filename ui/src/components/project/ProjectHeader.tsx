import { Anchor, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { changeCount, formatChangeCount, formatResolution, formatTime } from '../../format';
import type { ListedRun, Project } from '../../types';
import { BaselineBadge } from '../entities/BaselineBadge';
import { RunStatusBadge } from '../entities/RunStatusBadge';

type Props = {
    project: Project;
    latest?: ListedRun;
};

export function ProjectHeader({ project, latest }: Props) {
    const latestChanges = latest ? changeCount(latest.run) : null;

    return (
        <Stack gap="4">
            {latest && (
                <Group>
                    <RunStatusBadge run={latest.run} />
                    {latest.approved ? <BaselineBadge /> : null}
                </Group>
            )}
            <Anchor href={project.url} target="_blank" rel="noreferrer">
                {project.url}
            </Anchor>
            <Text size="sm" c="dimmed">
                Resolutions: {project.resolutions.map(formatResolution).join(', ')}
            </Text>
            <Text size="sm" c="dimmed" component="div">
                {latest ? (
                    <Group gap="xs">
                        <Text span size="sm" c="dimmed">
                            Latest run{' '}
                            <Anchor component={Link} to={`/runs/${latest.run.id}`}>
                                {formatTime(latest.run.createdAt)}
                            </Anchor>
                        </Text>
                        {latestChanges === null ? null : (
                            <Text span size="sm" c="dimmed">{formatChangeCount(latestChanges)}</Text>
                        )}
                    </Group>
                ) : 'No runs yet'}
            </Text>
        </Stack>
    );
}
