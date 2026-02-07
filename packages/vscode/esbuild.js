const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const config = {
	entryPoints: ['src/extension.ts'],
	bundle: true,
	outfile: 'dist/extension.js',
	external: ['vscode'],
	format: 'cjs',
	platform: 'node',
	target: 'node18',
	sourcemap: true,
	minify: false,
};

async function main() {
	if (isWatch) {
		const ctx = await esbuild.context(config);
		await ctx.watch();
		console.log('Watching for changes...');
	} else {
		await esbuild.build(config);
		console.log('Build complete: dist/extension.js');
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
