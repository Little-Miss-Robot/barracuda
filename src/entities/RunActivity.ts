export type RunActivity = {
    step: 'scraping' | 'capturing' | 'comparing'
    done?: number
    total?: number
};
