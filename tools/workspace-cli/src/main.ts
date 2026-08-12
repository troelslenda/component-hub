#!/usr/bin/env node
import { checkWorkspace, findRepositoryRoot, openWorkspace } from './workspace';

const HELP = `Component Hub local workspace companion

Usage:
  npm run workspace -- open <workspace-branch> [--skip-install] [--no-start] [--worktree-root <path>]
  npm run workspace -- check [--base <git-ref>]

Examples:
  npm run workspace -- open workspace/date-range-picker/date-picker-init
  npm run workspace -- check
`;

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function main(args: string[]): void {
  const command = args[0];
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(HELP);
    return;
  }

  const repositoryRoot = findRepositoryRoot(process.cwd());
  if (command === 'open') {
    const branch = args[1];
    if (!branch || branch.startsWith('--'))
      throw new Error('The workspace branch is required.');
    openWorkspace(branch, {
      repositoryRoot,
      worktreeRoot: valueAfter(args, '--worktree-root'),
      install: !args.includes('--skip-install'),
      start: !args.includes('--no-start'),
    });
    return;
  }

  if (command === 'check') {
    const violations = checkWorkspace(
      repositoryRoot,
      undefined,
      valueAfter(args, '--base') || 'origin/main',
    );
    if (violations.length) {
      process.stderr.write('Changes outside this workspace component:\n');
      for (const file of violations) process.stderr.write(`  - ${file}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write('Component boundary check passed.\n');
    }
    return;
  }

  throw new Error(`Unknown command '${command}'.\n\n${HELP}`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
