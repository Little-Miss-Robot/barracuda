import {AspectRatio} from '@mantine/core';
import {imagePath} from '../../format';
import type { Run } from '../../types';

export default function RunThumbnail({ run }: { run: Run }) {
    return (
        <AspectRatio ratio={1080 / 650}>
            {run.comparisons[0] && (
                <img
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    src={imagePath(run.id, run.comparisons[0].urlId, 'images', run.comparisons[0].resolution)}
                />
            )}
        </AspectRatio>
    );
}
