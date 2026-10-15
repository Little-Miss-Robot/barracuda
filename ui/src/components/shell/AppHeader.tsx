import { Anchor, Burger, Group, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

type Props = {
    opened: boolean;
    onToggle: () => void;
};

export function AppHeader({ opened, onToggle }: Props) {
    return (
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger
                    opened={opened}
                    onClick={onToggle}
                    hiddenFrom="sm"
                    size="sm"
                    aria-label="Toggle navigation"
                />
                <Anchor component={Link} to="/" fw={700} size="lg" c="inherit" underline="never">
                    Barracuda
                </Anchor>
            </Group>
            <Text size="sm" c="dimmed" visibleFrom="sm">Visual regression testing</Text>
        </Group>
    );
}
