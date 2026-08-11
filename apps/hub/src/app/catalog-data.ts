export type ComponentStatus = 'poc' | 'experimental' | 'beta' | 'production' | 'deprecated';

export interface CatalogComponent {
  id: string;
  name: string;
  packageName: string;
  status: ComponentStatus;
  owners: string[];
  description: string;
  figmaUrl: string | null;
  releaseState: string;
  sourceVersion: string;
  storyId: string;
  repositoryPath: string;
  releases: Array<{ version: string; date: string }>;
}

export const storybookUrl = (component: CatalogComponent): string =>
  `http://localhost:4400/?path=/story/${component.storyId}`;

export const storybookEmbedUrl = (component: CatalogComponent): string =>
  `http://localhost:4400/iframe.html?id=${component.storyId}&viewMode=story`;
