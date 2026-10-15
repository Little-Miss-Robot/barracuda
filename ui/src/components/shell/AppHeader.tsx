import { Burger } from '@mantine/core';

type Props = {
    opened: boolean;
    onToggle: () => void;
};

export function AppHeader({ opened, onToggle }: Props) {
    return (
        <Burger
            opened={opened}
            onClick={onToggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
        />
    );
}
