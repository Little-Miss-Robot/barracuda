import Module from "../components/Module";
import {LoadingState} from "../components/Status";

export function LogsPage() {

    return (
        <Module
            title="Logs"
            crumbs={[
                { label: "Dashboard", to: "/" },
                { label: "Logs" },
            ]}
        >
            <LoadingState label="Loading logs…" />
        </Module>
    );
}
