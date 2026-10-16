import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { subscribeToRun } from '../api';
import { isActive } from '../format';
import {ListedRun} from "../../../src/entities/ListedRun";

export function useLiveRuns(
    runs: ListedRun[] | null,
    setRuns: Dispatch<SetStateAction<ListedRun[] | null>>,
): void {
    const activeIds = (runs ?? [])
        .filter((item) => isActive(item.run.status))
        .map((item) => item.run.id)
        .sort()
        .join('\n');

    useEffect(() => {
        if (!activeIds) {
            return;
        }

        const stops = activeIds.split('\n').map((runId) => subscribeToRun(runId, (next) => {
            setRuns((current) => current?.map((item) => (
                item.run.id === next.run.id ? next : item
            )) ?? current);
        }));

        return () => {
            for (const stop of stops) {
                stop();
            }
        };
    }, [activeIds, setRuns]);
}
