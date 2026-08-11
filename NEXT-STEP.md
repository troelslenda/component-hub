# Next Step: Connect the Hub to GitHub

## Where we are

Component Hub currently has:

- An Angular Hub application with a component catalog, component details, Storybook embeds, and prototype workspace screens.
- A centralized Angular Storybook containing the component stories.
- A NestJS API under `apps/api`.
- Component endpoints backed by checked-in `component.json` and `package.json` files.
- Workspace API contracts with an injectable `WorkspaceRepository` boundary.
- A placeholder `GithubWorkspaceRepository` that returns no fake workspaces and reports `GITHUB_NOT_CONFIGURED` for writes.
- One development command for the Hub, API, and Storybook:

  ```bash
  npm run dev
  ```

Development URLs:

- Hub: <http://localhost:4200>
- API: <http://localhost:3000/api>
- Storybook: <http://localhost:4400>

## Completed: Angular/API connection

The Angular Hub now uses the NestJS API for components and workspaces.

1. `CatalogService` uses:
   - `GET /api/components`
   - `GET /api/components/:componentId`
2. `WorkspaceService` uses:
   - `GET /api/components/:componentId/workspaces`
   - `POST /api/components/:componentId/workspaces`
3. Loading, empty, validation, and API-error states are present.
4. The hardcoded `date-range-picker-init` workspace has been removed.
5. HTTP contract tests cover the Angular services; API tests cover component metadata.

## Immediate implementation step

Configure the GitHub App details below, then implement `GithubWorkspaceRepository` list/create behavior and its tests. Keep workspace creation idempotent so retries cannot create duplicate branches or pull requests.

## GitHub integration after that

Implement the existing NestJS `WorkspaceRepository` with a GitHub App:

```text
Create workspace in Angular
        ↓
POST /api/components/:componentId/workspaces
        ↓
NestJS validates the request
        ↓
GitHub App creates a workspace branch
        ↓
GitHub App creates a draft pull request
        ↓
Normalized workspace is returned to Angular
```

The create operation must be idempotent and must not accidentally create duplicate branches or pull requests.

## GitHub information needed

Decide/provide:

- GitHub owner or organization
- Repository name
- Default branch, expected to be `main`
- Whether the GitHub App can access only this repository (recommended) or all organization repositories

Create a private GitHub App with these repository permissions:

- Contents: Read and write
- Pull requests: Read and write
- Metadata: Read-only (included automatically)

Install the app on the Component Hub repository and configure these local environment values:

```dotenv
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY_PATH=
GITHUB_OWNER=
GITHUB_REPOSITORY=
GITHUB_DEFAULT_BRANCH=main
```

Store the GitHub App `.pem` private key outside the repository. Never commit it or paste its contents into chat.

Webhooks are not required for the first create-workspace integration. Later, PR and push synchronization will add:

```dotenv
GITHUB_WEBHOOK_SECRET=
GITHUB_WEBHOOK_URL=
```

## Current backend endpoints

```text
GET  /api/components
GET  /api/components/:componentId
GET  /api/components/:componentId/workspaces
POST /api/components/:componentId/workspaces
```

## Before starting next time

```bash
npm install
npm run dev
```

If Nx reports that a continuous task is owned by another process even though no server is listening:

```bash
npm exec nx -- reset
```

Do not run multiple copies of `npm run dev` at the same time because ports 4200, 3000, and 4400 are fixed.
