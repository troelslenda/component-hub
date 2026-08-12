import { join } from 'node:path';
import {
  defaultWorktreePath,
  parseWorkspaceBranch,
  unexpectedFiles,
} from './workspace';

describe('workspace companion', () => {
  const identity = {
    branch: 'workspace/date-range-picker/date-picker-init',
    componentId: 'date-range-picker',
    workspaceId: 'date-picker-init',
  };

  it('parses the workspace identity from its branch', () => {
    expect(parseWorkspaceBranch(identity.branch)).toEqual(identity);
    expect(() => parseWorkspaceBranch('feature/date-picker')).toThrow(
      'workspace/<component-id>/<workspace-id>',
    );
  });

  it('places worktrees beside the primary checkout', () => {
    expect(
      defaultWorktreePath('/projects/component-hub', identity.workspaceId),
    ).toBe(join('/projects', 'component-hub-workspaces', 'date-picker-init'));
  });

  it('allows only the component and its workspace manifest to change', () => {
    expect(
      unexpectedFiles(identity, [
        'packages/components/date-range-picker/src/lib/date-range-picker.ts',
        '.component-hub/workspaces/date-range-picker/date-picker-init.json',
        'packages/components/notification-banner/src/lib/notification-banner.ts',
        'nx.json',
      ]),
    ).toEqual([
      'packages/components/notification-banner/src/lib/notification-banner.ts',
      'nx.json',
    ]);
  });
});
