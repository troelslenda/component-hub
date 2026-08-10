import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readJson,
  runTasksInSerial,
  type Tree,
  updateJson,
  writeJson,
} from '@nx/devkit';
import {
  libraryGenerator,
  storybookConfigurationGenerator,
  UnitTestRunner,
} from '@nx/angular/generators';
import type { ComponentGeneratorSchema } from './schema';

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema,
) {
  const normalizedName = names(options.name).fileName;
  const projectRoot = `packages/components/${normalizedName}`;
  const packageName = options.packageName ?? `@organization/${normalizedName}`;
  const status = options.status ?? 'poc';

  if (tree.exists(projectRoot)) {
    throw new Error(`A component already exists at ${projectRoot}.`);
  }

  const libraryTask = await libraryGenerator(tree, {
    directory: projectRoot,
    name: normalizedName,
    publishable: true,
    importPath: packageName,
    standalone: true,
    flat: true,
    displayBlock: true,
    style: 'scss',
    strict: true,
    linter: 'eslint',
    unitTestRunner: UnitTestRunner.VitestAngular,
    tags: `type:component,scope:shared,maturity:${status},publishable`,
    skipFormat: true,
  });

  const storybookTask = await storybookConfigurationGenerator(tree, {
    project: normalizedName,
    generateStories: false,
    configureStaticServe: true,
    interactionTests: false,
    linter: 'eslint',
    skipFormat: true,
  });

  const rootPackageJson = readJson(tree, 'package.json');
  updateJson(tree, joinPathFragments(projectRoot, 'package.json'), (json) => {
    const peerDependencies = { ...json.peerDependencies };
    delete peerDependencies['@angular/common'];

    return {
      ...json,
      name: packageName,
      version: '0.0.0',
      private: false,
      peerDependencies,
    };
  });

  writeJson(tree, joinPathFragments(projectRoot, 'component.json'), {
    id: normalizedName,
    name: options.displayName ?? names(normalizedName).className,
    packageName,
    status,
    owners: [options.owner],
    description: options.description ?? '',
    figmaUrl: null,
    releaseState: 'unreleased',
  });

  const eslintConfigPath = joinPathFragments(projectRoot, 'eslint.config.mjs');
  const eslintConfig = tree.read(eslintConfigPath, 'utf-8');
  if (eslintConfig) {
    const dependencyCheckConfig = eslintConfig.replace(
      "ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],",
      "ignoredDependencies: ['@storybook/angular'],\n          ignoredFiles: [\n            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',\n            '{projectRoot}/**/*.stories.ts',\n          ],",
    );
    const endOfConfig = dependencyCheckConfig.lastIndexOf('];');
    tree.write(
      eslintConfigPath,
      `${dependencyCheckConfig.slice(0, endOfConfig)},\n  {\n    files: ['**/*.stories.ts'],\n    rules: { '@nx/dependency-checks': 'off' },\n  },\n${dependencyCheckConfig.slice(endOfConfig)}`,
    );
  }

  const templateOptions = {
    ...options,
    ...names(normalizedName),
    displayName: options.displayName ?? names(normalizedName).className,
    packageName,
    tmpl: '',
  };
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    projectRoot,
    templateOptions,
  );

  if (!Array.isArray(rootPackageJson.workspaces)) {
    updateJson(tree, 'package.json', (json) => ({
      ...json,
      workspaces: ['packages/components/*'],
    }));
  }

  await formatFiles(tree);

  return runTasksInSerial(libraryTask, storybookTask);
}

export default componentGenerator;
