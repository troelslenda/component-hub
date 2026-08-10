export interface ComponentGeneratorSchema {
  name: string;
  displayName?: string;
  description?: string;
  owner: string;
  packageName?: string;
  status?: 'poc' | 'experimental' | 'beta' | 'production' | 'deprecated';
}
