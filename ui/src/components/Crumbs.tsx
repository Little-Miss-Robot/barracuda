import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

type Crumb = {
    label: string;
    to?: string;
};

export function Crumbs({ items }: { items: Crumb[] }) {
    return (
        <Breadcrumbs>
            {items.map((item) => item.to ? (
                <Anchor key={item.to} component={Link} to={item.to}>
                    {item.label}
                </Anchor>
            ) : (
                <Text key={item.label}>{item.label}</Text>
            ))}
        </Breadcrumbs>
    );
}
