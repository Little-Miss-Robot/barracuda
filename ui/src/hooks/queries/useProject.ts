import { useQuery } from '@tanstack/react-query';
import {Project} from "../../../../src/entities/Project";
import {getProject} from "../../api";

export const useProject = (urlId: string) => {
    const query = useQuery<Project>({
        queryKey: ['projects', urlId],
        queryFn: () => getProject(urlId),
    });

    return {
        project: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
};