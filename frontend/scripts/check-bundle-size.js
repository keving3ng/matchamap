#!/usr/bin/env node

/**
 * Bundle Size Checker
 * 
 * Ensures bundle sizes stay within budget.
 * Run this in CI to fail builds that exceed limits.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '../dist/assets');

// Bundle size budgets (in KB, gzipped)
const BUDGETS = {
  'index': 100,      // Main bundle
  'maps': 50,        // Maps chunk
  'router': 15,      // Router chunk
  'vendor': 50,      // React + React DOM
  'admin': 30,       // Admin panel (when lazy-loaded)
};

const TOTAL_BUDGET = 150; // Total page weight budget

function getGzipSize(filePath) {
  const stats = fs.statSync(filePath);
  // Rough estimate: gzip is ~30% of original size
  // For actual gzip size, we'd need to read .gz files
  return Math.round(stats.size * 0.3 / 1024); // KB
}

function checkBundles() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ Dist directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  
  if (jsFiles.length === 0) {
    console.error('❌ No JS bundles found in dist/assets');
    process.exit(1);
  }

  let totalSize = 0;
  const results = [];
  let hasViolations = false;

  console.log('📦 Bundle Size Check\n');

  jsFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const sizeKB = getGzipSize(filePath);
    totalSize += sizeKB;

    // Check if this file matches a budget category
    for (const [name, budget] of Object.entries(BUDGETS)) {
      if (file.includes(name)) {
        const status = sizeKB <= budget ? '✅' : '❌';
        const violation = sizeKB > budget;
        
        results.push({
          file,
          sizeKB,
          budget,
          status,
          violation,
        });

        if (violation) {
          hasViolations = true;
          console.error(`${status} ${file}: ${sizeKB} KB (budget: ${budget} KB) - EXCEEDED by ${sizeKB - budget} KB`);
        } else {
          console.log(`${status} ${file}: ${sizeKB} KB (budget: ${budget} KB)`);
        }
        
        return;
      }
    }

    // Show files that don't match any budget category
    console.log(`ℹ️  ${file}: ${sizeKB} KB (no budget set)`);
  });

  console.log(`\n📊 Total bundle size: ${totalSize} KB (budget: ${TOTAL_BUDGET} KB)`);

  if (totalSize > TOTAL_BUDGET) {
    console.error(`❌ Total bundle size exceeds budget by ${totalSize - TOTAL_BUDGET} KB`);
    hasViolations = true;
  } else {
    console.log(`✅ Total bundle size within budget (${TOTAL_BUDGET - totalSize} KB remaining)`);
  }

  if (hasViolations) {
    console.error('\n❌ Bundle size check FAILED');
    console.log('\n💡 To fix bundle size issues:');
    console.log('1. Run `npm run build:analyze` to see what\'s in your bundles');
    console.log('2. Check for large dependencies that can be tree-shaken');
    console.log('3. Consider lazy loading heavy features');
    console.log('4. Look for duplicate dependencies');
    process.exit(1);
  } else {
    console.log('\n✅ Bundle size check PASSED');
  }
}

checkBundles();