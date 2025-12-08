#!/usr/bin/env node
/**
 * Integration test runner for Graph Node Developer Mode (GND)
 *
 * Usage: node run-integration-tests.js [config-path] [subgraph-name]
 *
 * Config file format (JSON):
 * {
 *   "tests": [
 *     {
 *       "name": "Test name",
 *       "query": "{ entities(first: 5) { id } }",
 *       "variables": {},
 *       "expected": { "entities": [...] },
 *       "matchType": "exists" | "exact" | "contains"
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.argv[2] || 'tests/integration/config.json';
const SUBGRAPH_NAME = process.argv[3] || 'my-subgraph';
const GRAPHQL_ENDPOINT = `http://localhost:8000/subgraphs/name/${SUBGRAPH_NAME}`;
const MAX_WAIT_SECONDS = 120;
const POLL_INTERVAL_MS = 2000;

async function waitForSubgraph() {
  console.log(`Waiting for subgraph at ${GRAPHQL_ENDPOINT}...`);
  const start = Date.now();

  while ((Date.now() - start) < MAX_WAIT_SECONDS * 1000) {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _meta { block { number } } }' })
      });
      const data = await response.json();
      if (data.data?._meta?.block?.number) {
        console.log(`Subgraph ready at block ${data.data._meta.block.number}`);
        return true;
      }
    } catch (e) {
      // Continue polling
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    process.stdout.write('.');
  }
  throw new Error(`Timeout waiting for subgraph after ${MAX_WAIT_SECONDS}s`);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function containsExpected(actual, expected) {
  if (typeof expected !== 'object' || expected === null) {
    return actual === expected;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    return expected.every((item, i) => containsExpected(actual[i], item));
  }

  for (const [key, value] of Object.entries(expected)) {
    if (!(key in actual)) return false;
    if (!containsExpected(actual[key], value)) return false;
  }
  return true;
}

async function runTest(test) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: test.query,
      variables: test.variables || {}
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`);
  }

  const matchType = test.matchType || 'exists';

  if (matchType === 'exact') {
    if (!deepEqual(result.data, test.expected)) {
      throw new Error(
        `Response mismatch.\nExpected: ${JSON.stringify(test.expected, null, 2)}\nActual: ${JSON.stringify(result.data, null, 2)}`
      );
    }
  } else if (matchType === 'contains') {
    if (!containsExpected(result.data, test.expected)) {
      throw new Error(
        `Response does not contain expected values.\nExpected to contain: ${JSON.stringify(test.expected, null, 2)}\nActual: ${JSON.stringify(result.data, null, 2)}`
      );
    }
  } else {
    // Default 'exists': just check no errors and data exists
    if (!result.data) {
      throw new Error('No data returned');
    }
  }

  return result.data;
}

async function main() {
  // Check if config file exists
  const configPath = path.resolve(CONFIG_PATH);
  if (!fs.existsSync(configPath)) {
    console.log(`No test config found at ${configPath}, skipping integration tests`);
    process.exit(0);
  }

  // Load config
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse config file: ${e.message}`);
    process.exit(1);
  }

  if (!config.tests || !Array.isArray(config.tests) || config.tests.length === 0) {
    console.log('No tests defined in config, skipping');
    process.exit(0);
  }

  // Wait for subgraph to be ready
  await waitForSubgraph();

  console.log(`\nRunning ${config.tests.length} integration test(s)...\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of config.tests) {
    const testName = test.name || 'Unnamed test';
    try {
      await runTest(test);
      console.log(`  ✓ ${testName}`);
      passed++;
    } catch (error) {
      console.log(`  ✗ ${testName}`);
      failed++;
      failures.push({ name: testName, error: error.message });
    }
  }

  // Print summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log(`\nFailures:\n`);
    for (const f of failures) {
      console.log(`  ${f.name}:`);
      console.log(`    ${f.error.split('\n').join('\n    ')}\n`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`Unexpected error: ${e.message}`);
  process.exit(1);
});
