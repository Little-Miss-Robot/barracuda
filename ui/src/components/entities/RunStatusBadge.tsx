import { Badge } from '@mantine/core';
import { label } from '../../format';
import type { Run, RunStatus } from '../../types';

const colorMap: Record<RunStatus, string> = {
    queued: 'gray',
    running: 'yellow',
    complete: 'green',
    failed: 'red',
};

export function RunStatusBadge({ run }: { run: Run }) {
    return (
        <Badge color={colorMap[run.status]} variant="light" style={{ flexShrink: 0 }}>
            {label(run.status)}
        </Badge>
    );
}
