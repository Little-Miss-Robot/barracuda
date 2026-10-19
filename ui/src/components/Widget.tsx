import {Group, Paper, Stack, Title} from "@mantine/core";
import {ReactNode} from "react";

type Props = {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
};

export default function Widget({ title, actions, children }: Props) {
    return (
        <Paper p="lg">
            <Stack gap="lg">
                <Group justify="space-between">
                    <Title order={4}>{title}</Title>
                    <Group>
                        {actions}
                    </Group>
                </Group>
                {children}
            </Stack>
        </Paper>
    );
}