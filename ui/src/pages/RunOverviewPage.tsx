import { RunsTable } from '../components/entities/RunsTable';
import {LoadingState} from '../components/Status';
import {useWindowTitle} from "../hooks/useWindowTitle";
import {useListedRuns} from "../hooks/queries/useListedRuns";
import Module from "../components/Module";

export function RunOverviewPage() {
    const { runs, isLoading } = useListedRuns();

    useWindowTitle('Runs');

    return (
        <Module
            title="Runs"
            crumbs={[
                { label: "Dashboard", to: "/" },
                { label: "Runs" }
            ]}
        >
            {isLoading ? (
                <LoadingState label="Loading runs…" />
            ) : (
                <RunsTable runs={runs || []} empty="No runs yet." showUrl />
            )}
        </Module>
    );
}
