import { useQuery } from '@tanstack/react-query';
import {Project} from "../../../../src/entities/Project";
import {listProjects} from "../../api";

export const useProjects = () => {
    const query = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: () => listProjects(),

    });

    return {
        projects: query.data,
        isLoading: query.isLoading,
        error: query.error,
    };
};