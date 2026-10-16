import { useQuery } from '@tanstack/react-query';
import {getRun} from "../../api";
import {ListedRun} from "../../../../src/entities/ListedRun";

export const useListedRun = (id: string) => {
    const query = useQuery<ListedRun>({
        queryKey: ['listedRun', id],
        queryFn: () => getRun(id),
    });

    return {
        run: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
};