import container from "./container";

async function main(): Promise<void> {

    const tester = container.make('tester');

    await tester.run('https://www.rubenshuis.be');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});