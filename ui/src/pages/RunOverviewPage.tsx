import { useEffect, useState } from 'react';
import { RunsTable } from '../components/entities/RunsTable';
import {LoadingState} from '../components/Status';
import type { ListedRun } from '../types';
import { useLiveRuns } from '../hooks/useLiveRuns';
import {useWindowTitle} from "../hooks/useWindowTitle";
import {useListedRuns} from "../hooks/queries/useListedRuns";
import Module from "../components/Module";

export function RunOverviewPage() {
    const [liveRuns, setLiveRuns] = useState<ListedRun[] | null>(null);
    const { runs, isLoading } = useListedRuns();

    useWindowTitle('Runs');
    useLiveRuns(liveRuns, setLiveRuns);

    useEffect(() => {
        if (runs) {
            setLiveRuns(runs);
        }
    }, [runs]);

    return (
        <Module title="Runs">
            {isLoading ? (
                <LoadingState label="Loading runs…" />
            ) : (
                <RunsTable runs={runs || []} empty="No runs yet." showUrl />
            )}
        </Module>
    );
}
