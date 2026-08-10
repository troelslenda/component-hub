import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { componentGenerator } from './generator';
import { ComponentGeneratorSchema } from './schema';

describe('component generator', () => {
  let tree: Tree;
  const options: ComponentGeneratorSchema = {
    name: 'date-range-picker',
    displayName: 'Date Range Picker',
    description: 'Select a date range.',
    owner: 'team-design-system',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await componentGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'date-range-picker');
    expect(config.root).toBe('packages/components/date-range-picker');
    expect(config.tags).toEqual([
      'type:component',
      'scope:shared',
      'maturity:poc',
      'publishable',
    ]);

    expect(
      tree.read('packages/components/date-range-picker/package.json', 'utf-8'),
    ).toContain('"version": "0.0.0"');
    expect(
      tree.read('packages/components/date-range-picker/component.json', 'utf-8'),
    ).toContain('"releaseState": "unreleased"');
  });
});
