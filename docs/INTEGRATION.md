# Integration Guide

This guide explains how to integrate the subgraphform CI/CD workflow into your subgraph repository.

## Quick Start

### 1. Create a workflow file in your repository

Create `.github/workflows/ci.yml` in your subgraph repository:

```yaml
name: Subgraph CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: your-subgraph-name
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

### 2. Configure GitHub Secrets

Add the following secret to your repository (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `GRAPH_DEPLOY_KEY` | Your deployment key from The Graph Studio |

### 3. Ensure your repository structure

Your repository should have the standard subgraph structure:

```
your-repo/
├── .github/
│   └── workflows/
│       └── ci.yml          # Your workflow calling subgraphform
├── abis/                   # Contract ABIs
├── src/                    # AssemblyScript mappings
├── schema.graphql          # GraphQL schema
├── subgraph.yaml           # Subgraph manifest
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## Workflow Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `subgraph-name` | string | **Yes** | - | The Graph Studio subgraph name for deployment |
| `working-directory` | string | No | `.` | Path to subgraph directory (if not at root) |
| `deploy-on-pr` | boolean | No | `false` | Deploy on pull requests |
| `deploy-on-main` | boolean | No | `true` | Deploy on push to main branch |
| `node-version` | string | No | `20` | Node.js version to use |
| `run-tests` | boolean | No | `true` | Run tests during CI |
| `run-integration-tests` | boolean | No | `false` | Run GND integration tests on main before deploy |
| `integration-test-config` | string | No | `tests/integration/config.json` | Path to integration test config |
| `ethereum-network` | string | No | `mainnet` | Ethereum network for GND (e.g., mainnet, sepolia) |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `GRAPH_DEPLOY_KEY` | **Yes** | The Graph Studio deployment key |
| `ETHEREUM_RPC_URL` | Only if `run-integration-tests: true` | Ethereum RPC endpoint for GND |

## Examples

### Basic Usage

Deploy to The Graph Studio on merge to main:

```yaml
name: Subgraph CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-awesome-subgraph
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

### Subgraph in Subdirectory

If your subgraph is in a subdirectory (e.g., `packages/subgraph`):

```yaml
jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph
      working-directory: packages/subgraph
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

### Deploy on Pull Requests

Deploy to a testnet on PRs for preview:

```yaml
jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph-testnet
      deploy-on-pr: true
      deploy-on-main: false
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

### Skip Tests

If you don't have tests set up yet:

```yaml
jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph
      run-tests: false
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

### Multiple Subgraphs

Deploy multiple subgraphs from a monorepo:

```yaml
name: Subgraph CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  subgraph-mainnet:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph-mainnet
      working-directory: subgraphs/mainnet
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}

  subgraph-arbitrum:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph-arbitrum
      working-directory: subgraphs/arbitrum
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

## Required package.json Scripts

Your `package.json` must include these scripts:

```json
{
  "scripts": {
    "codegen": "graph codegen",
    "build": "graph build",
    "test": "graph test"
  }
}
```

## Versioning

The workflow uses the git commit SHA (first 7 characters) as the version label when deploying. Each deployment creates a unique version like `a1b2c3d`.

## Troubleshooting

### "yarn.lock not found" error

Ensure you have a `yarn.lock` file in your working directory. Run `yarn install` locally and commit the lockfile.

### Deploy fails with authentication error

1. Verify `GRAPH_DEPLOY_KEY` is set correctly in GitHub Secrets
2. Ensure the key has permission to deploy to the specified subgraph
3. Check that the subgraph name matches exactly (case-sensitive)

### Tests fail but you want to deploy anyway

Set `run-tests: false` to skip tests. However, it's recommended to fix failing tests instead.

### Working directory issues

If using `working-directory`, ensure:
- The path is relative to the repository root
- The path does not start with `/` or `./`
- The directory contains `package.json` and `yarn.lock`

## Integration Testing with GND

The workflow supports integration testing using [Graph Node Developer Mode (GND)](https://thegraph.com/docs/en/subgraphs/developing/creating/graph-node-dev/). This spins up a local graph-node, deploys your subgraph, and runs predefined GraphQL queries to validate the subgraph works correctly before deploying to The Graph Studio.

### Enabling Integration Tests

1. **Add the ETHEREUM_RPC_URL secret** to your repository:
   - Go to Settings → Secrets and variables → Actions
   - Add `ETHEREUM_RPC_URL` with your Ethereum RPC endpoint (e.g., Alchemy or Infura)

2. **Enable integration tests** in your workflow:

```yaml
jobs:
  subgraph:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph
      run-integration-tests: true
      ethereum-network: mainnet
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
      ETHEREUM_RPC_URL: ${{ secrets.ETHEREUM_RPC_URL }}
```

3. **Create a test config file** at `tests/integration/config.json`:

```json
{
  "tests": [
    {
      "name": "Query recent transfers",
      "query": "{ transfers(first: 5) { id from to value } }",
      "matchType": "exists"
    },
    {
      "name": "Validate specific data",
      "query": "{ transfer(id: \"0x123\") { value } }",
      "expected": { "transfer": { "value": "1000000000000000000" } },
      "matchType": "exact"
    }
  ]
}
```

### Test Config Format

Each test in the config has the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Human-readable test name |
| `query` | string | Yes | GraphQL query to execute |
| `variables` | object | No | Query variables |
| `expected` | object | No | Expected response data |
| `matchType` | string | No | How to validate: `exists`, `exact`, or `contains` |

### Match Types

- **`exists`** (default): Passes if the query returns any data without errors
- **`exact`**: Passes if response exactly matches `expected`
- **`contains`**: Passes if response contains all keys/values in `expected`

### Example Test Configs

#### Basic Schema Validation

```json
{
  "tests": [
    {
      "name": "Query entities exist",
      "query": "{ transfers(first: 1) { id } }",
      "matchType": "exists"
    }
  ]
}
```

#### Exact Match

```json
{
  "tests": [
    {
      "name": "Validate known transfer",
      "query": "{ transfer(id: \"0xabc-1\") { from to } }",
      "expected": {
        "transfer": {
          "from": "0x1234...",
          "to": "0x5678..."
        }
      },
      "matchType": "exact"
    }
  ]
}
```

#### Contains Match

```json
{
  "tests": [
    {
      "name": "Transfer has required fields",
      "query": "{ transfers(first: 1) { id from to value } }",
      "expected": {
        "transfers": [{ "id": "0xabc-1" }]
      },
      "matchType": "contains"
    }
  ]
}
```

### How It Works

When `run-integration-tests: true` and a push to main is detected:

1. **Build**: The subgraph is built with `yarn codegen && yarn build`
2. **Start GND**: Graph Node Developer Mode starts with PostgreSQL
3. **Wait**: The test runner waits for the subgraph to sync (up to 2 minutes)
4. **Test**: Each query in the config is executed and validated
5. **Report**: Results are printed with pass/fail status
6. **Gate**: If any test fails, the deployment is blocked

### Troubleshooting Integration Tests

#### "Timeout waiting for subgraph"

- The subgraph may be taking too long to sync
- Check your RPC endpoint is working and has good rate limits
- The start block may be too far back; consider using a more recent block for testing

#### "GraphQL errors" in test results

- The query syntax may be invalid
- Entity names are case-sensitive; check your schema
- Check that queried fields exist in your schema

#### Tests pass locally but fail in CI

- Ensure `ETHEREUM_RPC_URL` secret is set in GitHub
- Check the RPC endpoint is accessible from GitHub Actions
- Verify the network name matches your subgraph.yaml
