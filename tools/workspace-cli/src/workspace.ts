import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

export interface WorkspaceIdentity {
  branch: string;
  componentId: string;
  workspaceId: string;
}

export interface OpenWorkspaceOptions {
  repositoryRoot: string;
  worktreeRoot?: string;
  install: boolean;
  start: boolean;
}

export function parseWorkspaceBranch(branch: string): WorkspaceIdentity {
  const match = branch.match(
    /^workspace\/([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/,
  );
  if (!match) {
    throw new Error(
      `Expected a branch named workspace/<component-id>/<workspace-id>, received '${branch}'.`,
    );
  }
  return { branch, componentId: match[1], workspaceId: match[2] };
}

export function defaultWorktreePath(
  repositoryRoot: string,
  workspaceId: string,
): string {
  return join(dirname(repositoryRoot), 'component-hub-workspaces', workspaceId);
}

export function unexpectedFiles(
  identity: WorkspaceIdentity,
  files: string[],
): string[] {
  const componentRoot = `packages/components/${identity.componentId}/`;
  const manifest = `.component-hub/workspaces/${identity.componentId}/${identity.workspaceId}.json`;
  return files.filter(
    (file) => file !== manifest && !file.startsWith(componentRoot),
  );
}

export function openWorkspace(
  branch: string,
  options: OpenWorkspaceOptions,
): string {
  const identity = parseWorkspaceBranch(branch);
  const existing = findWorktree(options.repositoryRoot, branch);
  const target =
    existing ||
    join(
      options.worktreeRoot ||
        dirname(
          defaultWorktreePath(options.repositoryRoot, identity.workspaceId),
        ),
      identity.workspaceId,
    );

  run('git', ['fetch', 'origin', branch], options.repositoryRoot);
  if (!existing) {
    if (existsSync(target)) {
      throw new Error(
        `Cannot create the worktree because '${target}' already exists and is not registered for ${branch}.`,
      );
    }
    mkdirSync(dirname(target), { recursive: true });
    if (
      succeeds(
        'git',
        ['show-ref', '--verify', `refs/heads/${branch}`],
        options.repositoryRoot,
      )
    ) {
      run('git', ['worktree', 'add', target, branch], options.repositoryRoot);
    } else {
      run(
        'git',
        [
          'worktree',
          'add',
          '--track',
          '-b',
          branch,
          target,
          `origin/${branch}`,
        ],
        options.repositoryRoot,
      );
    }
  }

  if (options.install) run('npm', ['install'], target);

  process.stdout.write(`\nWorkspace ready\n`);
  process.stdout.write(`  Component: ${identity.componentId}\n`);
  process.stdout.write(`  Branch:    ${branch}\n`);
  process.stdout.write(`  Directory: ${target}\n`);
  process.stdout.write(
    `  Storybook: http://localhost:4400/?path=/story/components-${identity.componentId}--showcase\n\n`,
  );
  process.stdout.write(
    `Check the component boundary with:\n  npm run workspace -- check\n\n`,
  );

  if (options.start) {
    run('npm', ['exec', 'nx', '--', 'storybook', 'storybook-host'], target);
  }
  return target;
}

export function checkWorkspace(
  repositoryRoot: string,
  branch = currentBranch(repositoryRoot),
  base = 'origin/main',
): string[] {
  const identity = parseWorkspaceBranch(branch);
  const committedAndTracked = output(
    'git',
    ['diff', '--name-only', base, '--'],
    repositoryRoot,
  ).split('\n');
  const untracked = output(
    'git',
    ['ls-files', '--others', '--exclude-standard'],
    repositoryRoot,
  ).split('\n');
  const files = [
    ...new Set([...committedAndTracked, ...untracked].filter(Boolean)),
  ];
  return unexpectedFiles(identity, files);
}

export function findRepositoryRoot(cwd: string): string {
  return output('git', ['rev-parse', '--show-toplevel'], cwd);
}

function currentBranch(repositoryRoot: string): string {
  return output('git', ['branch', '--show-current'], repositoryRoot);
}

function findWorktree(
  repositoryRoot: string,
  branch: string,
): string | undefined {
  const lines = output(
    'git',
    ['worktree', 'list', '--porcelain'],
    repositoryRoot,
  ).split('\n');
  let worktree: string | undefined;
  for (const line of lines) {
    if (line.startsWith('worktree ')) worktree = line.slice('worktree '.length);
    if (line === `branch refs/heads/${branch}`) return worktree;
    if (!line && worktree) worktree = undefined;
  }
  return undefined;
}

function output(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() || `${command} ${args.join(' ')} failed.`,
    );
  }
  return result.stdout.trim();
}

function succeeds(command: string, args: string[], cwd: string): boolean {
  return spawnSync(command, args, { cwd, stdio: 'ignore' }).status === 0;
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}.`,
    );
  }
}
