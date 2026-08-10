import {
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  runTasksInSerial,
  type Tree,
  updateJson,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit';
import { libraryGenerator, UnitTestRunner } from '@nx/angular/generators';
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
    prefix: 'hub',
    displayBlock: true,
    style: 'scss',
    strict: true,
    linter: 'none',
    unitTestRunner: UnitTestRunner.VitestAngular,
    tags: `type:component,scope:shared,maturity:${status},publishable`,
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

  writeJson(tree, joinPathFragments(projectRoot, 'tsconfig.json'), {
    extends: '../../../tools/config/tsconfig.angular-component.json',
    files: [],
    include: [],
    references: [
      { path: './tsconfig.lib.json' },
      { path: './tsconfig.spec.json' },
    ],
  });
  writeJson(tree, joinPathFragments(projectRoot, 'tsconfig.lib.json'), {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      declaration: true,
      declarationMap: false,
      inlineSources: true,
      types: [],
    },
    include: ['src/**/*.ts'],
    exclude: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      '**/*.stories.ts',
      '**/*.stories.js',
    ],
  });
  writeJson(tree, joinPathFragments(projectRoot, 'tsconfig.spec.json'), {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: '../../../dist/out-tsc',
      types: ['vitest/globals'],
    },
    include: ['src/**/*.ts', 'src/**/*.d.ts'],
  });
  tree.delete(joinPathFragments(projectRoot, 'tsconfig.lib.prod.json'));
  tree.delete(joinPathFragments(projectRoot, 'eslint.config.mjs'));

  const project = readProjectConfiguration(tree, normalizedName);
  const buildTarget = project.targets?.build;
  if (buildTarget) {
    delete buildTarget.defaultConfiguration;
    delete buildTarget.configurations;
  }
  project.targets = {
    ...project.targets,
    lint: { executor: '@nx/eslint:lint' },
  };
  updateProjectConfiguration(tree, normalizedName, project);

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

  return runTasksInSerial(libraryTask);
}

export default componentGenerator;
