# subgraphform

A reusable CI/CD workflow for [The Graph subgraphs](https://thegraph.com/docs/en/subgraphs/developing/subgraphs/). Integrate into any subgraph repository with a single workflow file.
- Auto build and run tests on PR to main
- Deploys subgraph automatically when merged to main
- Highly customizable

## Quick Start

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

Add the `GRAPH_DEPLOY_KEY` secret to your repository settings.

That's it! The workflow will:
- Build and test on pull requests
- Deploy to The Graph Studio on merge to main

**IMPORTANT:** We Reccomended pinning to the latest commit instead of main so you are in control of what version you are on. Pointing to main means you automatically receive our updates.

## Documentation

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for the full integration guide, including:
- All available inputs and options
- Examples for common use cases
- Troubleshooting guide

## Workflow Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `subgraph-name` | string | **Yes** | - | The Graph Studio subgraph name |
| `working-directory` | string | No | `.` | Path to subgraph directory |
| `deploy-on-pr` | boolean | No | `false` | Deploy on pull requests |
| `deploy-on-main` | boolean | No | `true` | Deploy on push to main |
| `node-version` | string | No | `20` | Node.js version |
| `run-tests` | boolean | No | `true` | Run tests during CI |

## Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `GRAPH_DEPLOY_KEY` | **Yes** | The Graph Studio deployment key |

## Examples

### Subgraph in subdirectory

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

### Multiple subgraphs

```yaml
jobs:
  mainnet:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph-mainnet
      working-directory: subgraphs/mainnet
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}

  arbitrum:
    uses: BreadchainCoop/subgraphform/.github/workflows/_subgraph-cicd.yml@main
    with:
      subgraph-name: my-subgraph-arbitrum
      working-directory: subgraphs/arbitrum
    secrets:
      GRAPH_DEPLOY_KEY: ${{ secrets.GRAPH_DEPLOY_KEY }}
```

## Live Example

This repository includes a working example that demonstrates the integration pattern:

- **[`.github/workflows/ci.yml`](.github/workflows/ci.yml)** - Example workflow that calls the reusable workflow
- **[`subgraph/`](subgraph/)** - Template subgraph used by the example workflow

The example workflow shows all available options with comments explaining each one. It runs on every PR and push to validate the reusable workflow works correctly.

```
.
├── .github/workflows/
│   ├── _subgraph-cicd.yml  # Reusable workflow (what you call)
│   └── ci.yml              # Example usage (copy this pattern)
└── subgraph/               # Example subgraph structure
    ├── abis/               # Contract ABIs
    ├── src/                # AssemblyScript mappings
    ├── docker-compose.yml  # Local graph-node setup
    ├── package.json        # Dependencies
    ├── schema.graphql      # GraphQL schema
    ├── subgraph.yaml       # Subgraph manifest
    └── tsconfig.json       # TypeScript config
```

## License

MIT
