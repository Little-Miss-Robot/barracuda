import {Divider, Group, Stack, Title} from "@mantine/core";
import {ReactNode} from "react";
import {Crumbs} from "./Crumbs";

type Crumb = {
    label: string;
    to?: string;
};

type Props = {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
    crumbs?: Crumb[]
};

export default function Module({ title, actions, children, crumbs = [] }: Props) {
    return (
        <Stack gap="lg">
            {crumbs?.length > 0 && (
                <Crumbs items={crumbs} />
            )}
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