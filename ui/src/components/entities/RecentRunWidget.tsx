import Widget from "../Widget";
import {RunsTable} from "./RunsTable";
import {useListedRuns} from "../../hooks/queries/useListedRuns";
import {Button} from "@mantine/core";
import {Link} from "react-router-dom";

export default function RecentRunWidget() {
    const { runs } = useListedRuns();
    const recentRuns = runs?.slice(0, 5) ?? [];

    return (
        <Widget
            title="Recent runs"
            actions={<Button component={Link} to="/runs" variant="transparent">View runs</Button>}
        >
            <RunsTable
                showUrl
                showDate={false}
                showId={false}
                runs={recentRuns}
                empty="No runs found"
            />
        </Widget>
    );
}