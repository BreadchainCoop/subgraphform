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

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `GRAPH_DEPLOY_KEY` | **Yes** | The Graph Studio deployment key |

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
