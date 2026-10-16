import { Badge } from '@mantine/core';

export function BaselineBadge({ children = 'Baseline' }: { children?: string }) {
    return (
        <Badge color="primary" style={{ flexShrink: 0 }}>
            {children}
        </Badge>
    );
}
