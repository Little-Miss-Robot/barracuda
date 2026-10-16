import {Divider, Group, Stack, Title} from "@mantine/core";
import {ReactNode} from "react";

type Props = {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
};

export default function Module({ title, actions, children }: Props) {
    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <Title order={2}>{title}</Title>
                <Group>
                    {actions}
                </Group>
            </Group>
            <Divider color="gray" />
            {children}
        </Stack>
    );
}