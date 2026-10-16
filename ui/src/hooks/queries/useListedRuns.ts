import { useQuery } from '@tanstack/react-query';
import {listRuns} from "../../api";
import {ListedRun} from "../../../../src/entities/ListedRun";

export const useListedRuns = () => {
    const query = useQuery<ListedRun[]>({
        queryKey: ['listedRuns'],
        queryFn: () => listRuns(),
    });

    return {
        runs: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
};