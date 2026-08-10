# Codex Handoff — Component Hub Prototype

## Objective

Build an initial prototype of a **Component Hub**: an internal platform for creating, discovering, experimenting with, evolving, previewing, versioning, and consuming reusable UI components.

The prototype should initially work for a single organization, but the architecture should avoid assumptions that would make future multi-organization support difficult.

This is not intended to replace GitHub, Storybook, Figma, or an artifact registry. The Hub should act as the **experience and orchestration layer** that connects those systems.

The long-term idea is a lifecycle platform for UI components:

**Design → Experiment → Develop → Preview → Review → Release → Consume → Evolve**

---

# Core Product Model

A reusable UI component should be treated as a first-class entity rather than merely a folder in a repository.

A component may have:

* Source code
* Git repository location
* Package name
* Semantic version
* Storybook showcase
* Maturity/status
* Maintainer / owner
* Consumers
* Active development workspaces
* Related Figma design
* Release history
* Dependencies
* Metadata

The Hub should correlate these resources rather than duplicate their underlying data unnecessarily.

---

# Suggested Terminology

Use these working concepts.

## Component

The canonical reusable UI artifact.

A component can eventually be published as its own package.

Example:

`@organization/date-range-picker`

## Workspace

A temporary development effort based on an existing component.

A workspace is similar to a lightweight fork, but it is intended to be temporary.

Typical lifecycle:

1. User clicks **Create Workspace**
2. Selects an existing component
3. Gives the workspace a name
4. Platform creates a Git branch
5. Platform creates a draft pull request
6. CI creates a preview
7. Developer works on the branch
8. Workspace can ultimately be:

   * merged into the canonical component
   * abandoned
   * potentially promoted into a separate component

A workspace should therefore not normally become a permanent fork.

## Experiment

A component or workspace may be explicitly experimental.

Experimentation must be considered a valid state rather than unfinished work that needs hiding.

## Release

An immutable published version of a component.

Example:

`@organization/date-range-picker@1.4.2`

Consumers must be able to stay on an existing version while development continues.

---

# Maturity Model

Components should expose an explicit maturity level.

Initial suggestion:

* `poc`
* `experimental`
* `beta`
* `production`
* `deprecated`

The exact naming can evolve.

Maturity should be stored as component metadata and surfaced prominently in the Hub and Storybook.

The purpose is to make risk visible rather than preventing experimentation.

---

# Repository Architecture

Use an **Nx monorepo** as the initial foundation.

Each component should be represented as its own Nx project/package.

Possible structure:

```text
/
  apps/
    hub/
    storybook/
  packages/
    date-range-picker/
    table-filter/
    contextual-help/
  tools/
    generators/
    metadata/
```

Do not treat this exact folder structure as mandatory if Nx conventions suggest something better.

Important characteristics:

* Components must remain independently versionable.
* Component dependencies should be inspectable.
* Nx generators should become the canonical mechanism for scaffolding components and workspaces.
* The same generators should eventually be callable both locally and by the Hub backend.

---

# Component Metadata

Define a simple machine-readable metadata format.

For example:

```json
{
  "id": "date-range-picker",
  "name": "Date Range Picker",
  "packageName": "@organization/date-range-picker",
  "status": "experimental",
  "owners": ["team-design-system"],
  "description": "Date range selection UI",
  "figmaUrl": null
}
```

Avoid building a complex database model prematurely.

Prefer metadata that can live with the component source where practical.

The Hub may aggregate/cache this information later.

---

# Storybook

Storybook should be the **component rendering and documentation engine**, but not the primary product interface.

The Hub is the primary interface.

The Hub should embed or link to Storybook where appropriate.

Each component needs a canonical **Showcase Story**.

The Showcase Story should require as little manual maintenance as possible.

Ideally:

* component inputs/props become controls automatically
* events/outputs are exposed automatically
* documentation comes from component metadata where possible
* new inputs should automatically appear in the showcase
* developers should not have to manually maintain basic showcase wiring

Manual stories should still be supported for:

* real-world examples
* edge cases
* workflows
* visual variants

A useful conceptual split could be:

* **Showcase** — generated/default representation
* **Examples** — manually authored scenarios
* **Playground** — free experimentation

Investigate Storybook Autodocs, generated controls, tags, and available status/tag badge mechanisms before creating custom solutions.

---

# Versioning

Do NOT rely on Storybook for package versioning.

Each component needs independent semantic versioning.

Recommended initial direction:

* npm-compatible packages
* SemVer
* Changesets or a similar release mechanism
* private registry for the prototype if necessary

Consumers should be able to use:

```json
{
  "@organization/date-range-picker": "1.2.3"
}
```

while development of `1.3.0` or `2.0.0` continues independently.

For the prototype, it is acceptable to use a lightweight private registry such as Verdaccio if access to the organization's existing registry is unavailable.

Registry integration must be abstracted enough that the prototype registry can later be replaced.

---

# Consumer Discovery

One key feature is automatically identifying which repositories consume which components.

Do not require consuming teams to register themselves manually.

Initial implementation can periodically scan repositories in a configured GitHub organization.

For each repository:

1. Read relevant `package.json` files.
2. Detect dependencies matching known component packages.
3. Record:

   * repository
   * package
   * requested version/range
   * possibly package file/location
4. Surface the results on the component page.

Example:

**Consumers of Date Range Picker**

* customer-onboarding — `1.3.2`
* advisor-dashboard — `^1.2.0`
* loan-application — `1.1.7`

This can initially be implemented as a scheduled scan.

Later improvements may distinguish:

* declared dependency
* lockfile-resolved dependency
* deployed version
* runtime usage

Do not build those advanced levels initially.

---

# GitHub Integration

GitHub remains the source of truth for source code and review.

The Hub should expose higher-level domain actions rather than forcing users to understand Git operations.

Examples:

### Create Component

User enters basic information.

The platform runs the appropriate Nx generator and creates the necessary Git changes.

Potential outcome:

* branch
* generated component package
* metadata
* showcase story
* pull request

### Create Workspace

User selects:

* source component
* workspace name

The platform creates:

* branch
* draft pull request
* workspace metadata
* preview pipeline

### Complete Workspace

Possible actions:

* merge into source component
* abandon workspace
* potentially convert to independent component later

Use a GitHub App or equivalent service identity rather than a personal user token.

Avoid using a generic “robot user” if a GitHub App provides a cleaner security model.

---

# Preview Environments

Every active workspace / pull request should eventually get a preview.

The preview should allow developers and designers to inspect the modified component before merge.

Initially this may simply be a Storybook deployment generated by CI.

The Hub should be able to display:

**Stable**

Current released component.

**Workspace**

Current branch/PR preview.

This enables visual comparison.

Do not build sophisticated visual diffing in the first iteration unless it is trivial to add.

---

# Hub UI

The Hub should eventually provide views similar to:

## Component Catalog

Searchable/filterable collection of components.

Possible filters:

* maturity
* owner
* package
* recently updated
* experimental
* production ready

## Component Detail

Show:

* name
* description
* maturity
* current version
* owners
* package name
* Storybook showcase
* active workspaces
* consumers
* releases
* dependencies
* Figma link if available

Primary actions:

* Create Workspace
* Open Storybook
* View Source
* Release
* Deprecate

Some actions may remain non-functional placeholders in the first UI iteration.

## Workspace Detail

Show:

* source component
* branch
* pull request
* creator
* preview
* status

Actions:

* open PR
* abandon
* potentially merge/promote depending on permissions

## Create Component

Self-service flow.

Minimal fields:

* name
* description
* package identifier
* owner
* maturity

Default maturity should likely be `poc` or `experimental`.

---

# Figma — Future Direction

Do not implement a deep Figma integration unless it can be done cheaply in the prototype.

However, architecture and metadata should allow a component to reference a Figma resource.

Longer term:

When creating a new component, the Hub could potentially create or associate a Figma workspace/component automatically.

A component's lifecycle would then connect:

```text
Figma
  ↓
Component Hub
  ↓
Git branch / workspace
  ↓
Storybook preview
  ↓
npm release
  ↓
Consumers
```

The Hub owns the relationship between these resources.

Figma should not become the canonical source of all component state.

---

# Existing Artifact Registry

The organization already has an artifact registry.

Production architecture should integrate with that registry rather than duplicate it.

However, the initial experiment may not receive access.

Therefore:

Create a registry adapter/interface.

For prototype development:

* use Verdaccio or another lightweight registry if needed

Later:

* implement adapter for the organization's real registry

Do not couple the rest of the application directly to Verdaccio.

---

# Potential SaaS / Multi-Organization Future

The first implementation is internal.

However, avoid hard-coding the assumption that there is globally only one organization.

Conceptually:

```text
Organization
  ├── GitHub integration
  ├── Registry integration
  ├── Figma integration
  ├── Members
  └── Components
```

Eventually an organization could invite users similarly to tools such as Figma.

This is NOT an MVP requirement.

Do not build billing, tenant isolation, invitations, or public marketplaces yet.

Just avoid making future multi-tenancy impossible.

---

# Product Philosophy

The product should optimize for **low-friction contribution**.

The current problem being solved is that developers hesitate to contribute to shared UI libraries because everything feels official, polished, scrutinized, and permanent.

The system should instead communicate:

> Experimentation is allowed here.

A component does not have to be production-ready to exist.

The maturity model makes risk explicit.

Developers consuming an experimental component knowingly accept that risk.

This creates a path such as:

```text
Idea
 ↓
POC
 ↓
Experimental
 ↓
Beta
 ↓
Production
 ↓
Deprecated
```

Workspaces create temporary branches off that lifecycle without permanently fragmenting the component catalog.

---

# Technical Direction

Preferred initial technologies:

* TypeScript
* Nx
* Angular
* Kirby Design System where practical
* Storybook
* Node.js / NestJS if a backend becomes necessary
* GitHub API / GitHub App
* Changesets
* npm-compatible registry
* Verdaccio for local/prototype registry if required

Do not introduce infrastructure merely because it may eventually be useful.

Prefer a working vertical slice.

---

# First Vertical Slice

Build the smallest version that demonstrates the core idea end-to-end.

It should support approximately this journey:

1. Open Component Hub.
2. See a list of components.
3. Open a component.
4. See metadata and embedded Storybook showcase.
5. Click **Create Workspace**.
6. Enter workspace name.
7. Generate a workspace through an Nx generator.
8. Create the corresponding Git branch / PR, or simulate this behind a clean adapter if GitHub integration blocks progress.
9. Show the workspace as active on the component page.
10. Allow the workspace component preview to appear in Storybook.
11. Maintain independent package metadata/versioning.

If repository credentials or GitHub App setup would block the prototype, implement GitHub behind an interface and provide a local/mock implementation first.

The UI/product flow is more important than production infrastructure in this phase.

---

# Architecture Requirement

Separate domain concepts from integrations.

For example:

```text
ComponentService
WorkspaceService
ReleaseService
ConsumerService

GitProvider
RegistryProvider
PreviewProvider
DesignProvider
```

This is conceptual rather than a mandated class structure.

The important principle is:

**The Component Hub understands components and their lifecycle. Integrations understand external systems.**

Do not spread GitHub-, Storybook-, registry-, or Figma-specific assumptions through the entire codebase.

---

# What NOT to Build Yet

Avoid premature implementation of:

* public marketplace
* billing
* complex RBAC
* full multi-tenancy
* production Kubernetes infrastructure
* custom package registry
* custom design renderer
* custom source control system
* advanced analytics
* deployment telemetry
* automated Figma synchronization
* complex visual regression systems
* permanent component forks

Use existing systems whenever possible.

---

# First Engineering Task

Start by inspecting the repository and determining what already exists.

Then:

1. Propose the Nx workspace architecture.
2. Define the initial domain model.
3. Define the component metadata schema.
4. Scaffold the Hub application.
5. Scaffold one example component.
6. Add Storybook.
7. Build the first component catalog/detail experience.
8. Add a generator for creating components.
9. Add the first version of `Create Workspace`.
10. Document architectural decisions as they are made.

Before making major architectural changes, keep the implementation understandable enough that another developer can inspect the repository and understand the model without reading large amounts of framework-specific code.

The prototype should feel like the beginning of a product, not an infrastructure experiment.

