export default class UrlIdGenerator {
    public generate(value: string) {
        const url = new URL(value);

        return `${url.hostname}${url.port ? `-${url.port}` : ''}${url.pathname}${url.search}`
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}