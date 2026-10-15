import { Anchor, Group, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { changeCount, formatTime } from '../../format';
import type { ListedRun } from '../../types';
import { BaselineBadge } from './BaselineBadge';
import { RunStatusBadge } from './RunStatusBadge';

type Props = {
    runs: ListedRun[];
    empty: string;
    showUrl?: boolean;
};

export function RunsTable({ runs, empty, showUrl = false }: Props) {
    if (runs.length === 0) {
        return <Text c="dimmed">{empty}</Text>;
    }

    return (
        <Table.ScrollContainer minWidth={860}>
        <Table striped withRowBorders={false} stripedColor="dark.8">
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>When</Table.Th>
                    {showUrl ? <Table.Th>Project</Table.Th> : null}
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Changes</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {runs.map((item) => {
                    const changes = changeCount(item.run);

                    return (
                        <Table.Tr key={item.run.id}>
                            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Anchor component={Link} to={`/runs/${item.run.id}`}>
                                    {formatTime(item.run.createdAt)}
                                </Anchor>
                            </Table.Td>
                            {showUrl ? (
                                <Table.Td>
                                    <Anchor component={Link} to={`/projects/${item.run.urlId}`} lineClamp={1} maw={360}>
                                        {item.run.url}
                                    </Anchor>
                                </Table.Td>
                            ) : null}
                            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                <Group gap="xs" wrap="nowrap">
                                    <RunStatusBadge run={item.run} />
                                    {item.approved ? <BaselineBadge /> : null}
                                </Group>
                            </Table.Td>
                            <Table.Td>{changes === null ? '—' : changes}</Table.Td>
                        </Table.Tr>
                    );
                })}
            </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
    );
}
