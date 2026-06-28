console.log = (...args) => {
	console.error(...args);
};

const { runScenario } = await import('./scenarios.mjs');

const request = JSON.parse(process.argv[2] ?? '{}');
const response = await runScenario(request);
process.stdout.write(JSON.stringify(response));