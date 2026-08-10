![](docs/component-hub.png)

**Component Hub is a collaborative home for the lifecycle of UI components.**

UI components rarely start production-ready.

They begin as ideas. They are explored by designers, prototyped by developers, tested in products, changed by other teams, versioned, shared, and — sometimes — mature into trusted building blocks.

Most component libraries are designed for the end of that journey.

Component Hub is designed for the whole thing.

## Why?

As shared component libraries mature, contributing to them often becomes increasingly difficult.

That is partly a good thing. Production components need stability, accessibility, documentation, testing, and responsible ownership.

But those expectations also make shared libraries a bad place to experiment.

The result is often that experimentation happens elsewhere: inside product repositories, private prototypes, temporary branches, or not at all. Useful components become difficult to discover, teams solve the same problems independently, and the path from *interesting idea* to *shared component* becomes unnecessarily difficult.

Component Hub explores a different model:

> Make experimentation cheap, make maturity visible, and let good ideas evolve.

## Components have a lifecycle

A component in Component Hub does not have to pretend to be finished.

It can move through different stages:

```text
POC → Experimental → Beta → Production → Deprecated
```

The maturity of a component is visible to everyone.

That means teams can make their own decisions about risk. An experimental component can be shared and reused without carrying the promise of a production-ready component.

## Workspaces

Existing components should also be easy to experiment with.

A **Workspace** is a temporary development environment based on a component.

Someone can create a workspace, modify the component, preview the result, collaborate on it, and eventually either merge the work back or abandon it.

This makes experimentation a normal part of the component lifecycle rather than something that happens outside the system.

## One component, many tools

A modern UI component exists in more than one place.

It may have:

* a design in Figma,
* source code in GitHub,
* a Storybook showcase,
* published package versions,
* active experiments,
* and applications that consume it.

Component Hub connects those pieces into a single experience.

It does not aim to replace those tools.

**GitHub understands source code.
Figma understands design.
Storybook understands component previews.
Registries understand packages.
Component Hub understands the component.**

## Self-service by default

Creating and evolving components should not require knowing the internal structure of a monorepo or remembering a collection of Git commands.

The Hub should expose actions in terms of what the user actually wants to do:

**Create Component**

**Create Workspace**

**Release**

**Deprecate**

The infrastructure underneath can take care of the mechanics.

The goal is to make contributing to a shared component ecosystem feel approachable enough that experimentation actually happens there.

## More than a component library

Component Hub started from a simple need: create a better place for teams to build and share extensions around an existing design system.

But the underlying problem is broader.

Designers and developers need a shared place where UI ideas can start unfinished, become collaborative, evolve safely, and eventually become dependable building blocks.

That is what we are building.

**A home for UI components from first idea to production — and everything in between.**

---

## Building Component Hub

This project is currently experimental.

The architecture, technical direction, current scope, and implementation guidance are documented in [`BUILD_INSTRUCTIONS.md`](./docs/BUILD_INSTRUCTIONS.md).

### Local development

Install dependencies and start the Angular Hub application:

```bash
npm install
npm exec nx -- serve hub
```

Create a component through the Component Hub generator:

```bash
npm exec nx -- g @component-hub/plugin:component date-range-picker \
  --displayName="Date Range Picker" \
  --description="Select a start and end date." \
  --owner=team-design-system \
  --status=poc
```

The generated package is placed under `packages/components`, starts at the
unreleased version `0.0.0`, and includes Component Hub metadata, tests, and an
Autodocs-enabled showcase story. ESLint, TypeScript defaults, and Storybook are
configured centrally rather than copied into every component.

Useful validation commands:

```bash
npm exec nx -- run-many -t build test lint --all
npm exec nx -- build-storybook storybook-host
```

## License

MIT
