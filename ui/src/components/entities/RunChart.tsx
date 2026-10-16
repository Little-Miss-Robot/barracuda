import {ProgressLabel, ProgressRoot, ProgressSection, Tooltip} from '@mantine/core';
import {Run} from "../../../../src/entities/Run";
import {ComparisonStatus} from "../../types";

type Props = {
    run: Run,
    size?: number,
};

export default function RunChart({ run, size = 18 }: Props) {

    const comparisons = run.comparisons;
    const counts = new Map<ComparisonStatus, number>([]);

    for (const comparison of comparisons) {
        counts.set(comparison.status, (counts.get(comparison.status) ?? 0) + 1);
    }
    const total = comparisons.length;

    const percentage = (status: ComparisonStatus): number =>
        total === 0 ? 0 : ((counts.get(status) ?? 0) / total) * 100;

    return (
        <ProgressRoot size={size}>
            <Tooltip label={`Changed: ${counts.get('changed')}`}>
                <ProgressSection value={percentage('changed')} color="primary">
                    <ProgressLabel>Changed</ProgressLabel>
                </ProgressSection>
            </Tooltip>
            <Tooltip label={`Unchanged: ${counts.get('unchanged')}`}>
                <ProgressSection value={percentage('unchanged')} color="gray">
                    <ProgressLabel>Unchanged</ProgressLabel>
                </ProgressSection>
            </Tooltip>
            <Tooltip label={`Added: ${counts.get('added')}`}>
                <ProgressSection value={percentage('added')} color="green">
                    <ProgressLabel>Added</ProgressLabel>
                </ProgressSection>
            </Tooltip>
            <Tooltip label={`Removed: ${counts.get('removed')}`}>
                <ProgressSection value={percentage('removed')} color="orange">
                    <ProgressLabel>Removed</ProgressLabel>
                </ProgressSection>
            </Tooltip>
            <Tooltip label={`Failed: ${counts.get('error')}`}>
                <ProgressSection value={percentage('error')} color="red">
                    <ProgressLabel>Failed</ProgressLabel>
                </ProgressSection>
            </Tooltip>
        </ProgressRoot>
    )
}
