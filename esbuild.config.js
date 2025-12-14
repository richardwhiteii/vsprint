const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const production = process.env.NODE_ENV === 'production';
const watch = process.argv.includes('--watch');

/**
 * Copy theme CSS files to dist directory
 */
function copyThemes() {
  const themesDir = path.join(__dirname, 'src', 'themes');
  const distThemesDir = path.join(__dirname, 'dist', 'themes');

  // Create dist/themes directory if it doesn't exist
  if (!fs.existsSync(distThemesDir)) {
    fs.mkdirSync(distThemesDir, { recursive: true });
  }

  // Copy all CSS files from src/themes to dist/themes
  const themeFiles = fs.readdirSync(themesDir).filter(file => file.endsWith('.css'));

  themeFiles.forEach(file => {
    const srcPath = path.join(themesDir, file);
    const destPath = path.join(distThemesDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied theme: ${file}`);
  });
}

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: !production,
    minify: production,
    logLevel: 'info',
  });

  if (watch) {
    console.log('Watching for changes...');
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }

  // Copy theme files after build
  copyThemes();
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
