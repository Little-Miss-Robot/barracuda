import {useWindowTitle} from "../hooks/useWindowTitle";
import Module from "../components/Module";
import { Grid } from "@mantine/core";
import RecentRunWidget from "../components/entities/RecentRunWidget";

export function DashboardPage() {

    useWindowTitle('Dashboard');

    return (
        <Module
            title="Dashboard"
            crumbs={[
                {
                    label: "Dashboard",
                }
            ]}
        >
            <Grid>
                <Grid.Col span={{ base: 12, xs: 6 }}>
                    <RecentRunWidget />
                </Grid.Col>
            </Grid>
        </Module>
    );
}
