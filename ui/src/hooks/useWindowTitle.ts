import { useEffect } from 'react';

export function useWindowTitle(title: string): void {
    useEffect(() => {
        document.title = title+' · Barracuda';
    }, [title]);
}
