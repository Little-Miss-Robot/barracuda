import { Badge } from '@mantine/core';
import { label } from '../../format';
import type { ComparisonStatus } from '../../types';

const colorMap: Record<ComparisonStatus, string> = {
    unchanged: 'gray',
    changed: 'orange',
    added: 'blue',
    removed: 'grape',
    error: 'red',
};

export function ComparisonStatusBadge({ status }: { status: ComparisonStatus }) {
    return (
        <Badge color={colorMap[status]} variant="light">
            {label(status)}
        </Badge>
    );
}
