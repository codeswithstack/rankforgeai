# Contributing to RankForge AI

## Setup

```bash
git clone https://github.com/ainethaji/rankforge.git
cd rankforge
npm install
```

## Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type-check all packages
npm run typecheck

# Build all packages
npm run build
```

## Project Structure

Each package lives in `packages/<name>/`. Add your changes to the relevant package, write tests in `packages/<name>/src/__tests__/`, and ensure all tests pass before submitting a PR.

## Submitting Changes

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes with tests
3. Run `npm test` — all tests must pass
4. Create a changeset: `npx changeset`
5. Open a pull request

## Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning. When your PR changes a package's behavior, run:

```bash
npx changeset
```

Follow the prompts to describe the change type (patch/minor/major) and what changed.
