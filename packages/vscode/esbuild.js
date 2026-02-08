const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
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
	sourcemap: false,
	minify: false,
};

/**
 * Copy assets from core package to dist/assets for bundling with the extension.
 * This ensures bundled assets are accessible via extensionUri resolution.
 */
function copyAssets() {
	const srcAssets = path.join(__dirname, '..', 'core', 'assets');
	const destAssets = path.join(__dirname, 'dist', 'assets');

	console.log('Copying assets from core to dist...');

	// Remove existing assets if present
	if (fs.existsSync(destAssets)) {
		fs.rmSync(destAssets, { recursive: true });
	}

	// Copy assets recursively
	fs.cpSync(srcAssets, destAssets, { recursive: true });

	const fileCount = countFiles(destAssets);
	console.log(`Copied ${fileCount} asset files to dist/assets`);

	// Copy media folder (icons) to dist
	const srcMedia = path.join(__dirname, 'media');
	const destMedia = path.join(__dirname, 'dist', 'media');

	if (fs.existsSync(srcMedia)) {
		if (fs.existsSync(destMedia)) {
			fs.rmSync(destMedia, { recursive: true });
		}
		fs.cpSync(srcMedia, destMedia, { recursive: true });
		console.log('Copied media files to dist/media');
	}

	// Copy marketplace icon to dist
	const srcIcon = path.join(__dirname, 'icon.png');
	const destIcon = path.join(__dirname, 'dist', 'icon.png');

	if (fs.existsSync(srcIcon)) {
		fs.copyFileSync(srcIcon, destIcon);
		console.log('Copied icon.png to dist');
	}
}

/**
 * Count files recursively in a directory
 */
function countFiles(dir) {
	let count = 0;
	const items = fs.readdirSync(dir, { withFileTypes: true });
	for (const item of items) {
		if (item.isDirectory()) {
			count += countFiles(path.join(dir, item.name));
		} else {
			count++;
		}
	}
	return count;
}

async function main() {
	if (isWatch) {
		const ctx = await esbuild.context(config);
		await ctx.watch();
		console.log('Watching for changes...');
		copyAssets(); // Copy assets once at start
	} else {
		await esbuild.build(config);
		copyAssets();
		console.log('Build complete: dist/extension.js');
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
