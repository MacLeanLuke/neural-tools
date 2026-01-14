#!/usr/bin/env node

/**
 * Minify JavaScript files in the dist directory
 * This script minifies all .js files while preserving .d.ts files
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const { glob } = require('glob');

async function minifyFiles(distDir) {
  if (!fs.existsSync(distDir)) {
    console.error(`Error: Directory ${distDir} does not exist`);
    process.exit(1);
  }

  // Find all .js files (excluding .d.ts files)
  const pattern = path.join(distDir, '**/*.js');
  const files = await glob(pattern, {
    ignore: ['**/*.d.ts', '**/*.map'],
    nodir: true
  });

  if (files.length === 0) {
    console.log('No JavaScript files found to minify');
    return;
  }

  console.log(`Minifying ${files.length} files...`);

  for (const file of files) {
    try {
      const code = fs.readFileSync(file, 'utf8');

      const result = await minify(code, {
        compress: {
          dead_code: true,
          drop_console: false, // Keep console logs for debugging
          drop_debugger: true,
          unused: true
        },
        mangle: {
          toplevel: true,
          reserved: [] // Add any reserved identifiers if needed
        },
        format: {
          comments: false
        },
        sourceMap: false
      });

      if (result.code) {
        fs.writeFileSync(file, result.code, 'utf8');
        const originalSize = code.length;
        const minifiedSize = result.code.length;
        const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
        console.log(`✓ ${path.relative(process.cwd(), file)} (${reduction}% smaller)`);
      }
    } catch (error) {
      console.error(`✗ Error minifying ${file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('✓ Minification complete');
}

// Get dist directory from command line args or use default
const distDir = process.argv[2] || 'dist';
minifyFiles(distDir).catch(error => {
  console.error('Minification failed:', error);
  process.exit(1);
});
