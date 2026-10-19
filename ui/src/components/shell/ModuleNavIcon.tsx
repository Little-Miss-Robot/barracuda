import {ActionIcon, Tooltip} from "@mantine/core";
import {Link, useLocation} from "react-router-dom";
import {ReactNode} from "react";

type Props = {
    path: string,
    label: string,
    children: ReactNode
};

export default function ModuleNavIcon({ path, label, children }: Props) {
    const { pathname } = useLocation();

    return (
        <Tooltip label={label}>
            <ActionIcon
                variant={(path === '/' && pathname === '/') || (path !== '/' && pathname.startsWith(path)) ? 'filled' : 'subtle'}
                aria-label={label}
                component={Link}
                to={path}
                size="xl"
            >
                {children}
            </ActionIcon>
        </Tooltip>
    );
}