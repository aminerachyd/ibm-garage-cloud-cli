export interface PayloadConfig {
  repo: string;
  url: string;
  path: string;
}

export interface ArgoConfig extends PayloadConfig {
  project: string;
}

export interface BootstrapConfig {
  'argocd-config': ArgoConfig;
}

export interface LayerConfig {
  'argocd-config': ArgoConfig;
  payload: PayloadConfig;
}

export interface GitOpsConfig {
  bootstrap: BootstrapConfig;
  infrastructure: LayerConfig;
  services: LayerConfig;
  applications: LayerConfig;
}

export interface GitOpsCredential {
  repo: string;
  url: string;
  username: string;
  token: string;
}
export type GitOpsCredentials = Array<GitOpsCredential>;

export enum GitOpsLayer {
  infrastructure = 'infrastructure',
  services = 'services',
  applications = 'applications'
}
export type GitOpsModuleOptions = GitOpsModuleInputBase & Partial<GitOpsModuleInputDefaults> & {
  bootstrapRepoUrl?: string;
  gitopsConfigFile?: string;
  gitopsCredentialsFile?: string;
  autoMerge?: boolean;
  rateLimit?: boolean;
  token?: string;
  valueFiles?: string;
  delete?: boolean;
};
export type GitOpsModuleInput = GitOpsModuleInputBase & GitOpsModuleInputDefaults & {
  valueFiles: string[];
  gitopsCredentials: GitOpsCredentials;
  gitopsConfig: GitOpsConfig;
  cascadingDelete?: boolean;
};

export interface GitOpsModuleInputBase {
  name: string;
  namespace: string;
  gitopsConfig: GitOpsConfig;
  ignoreDiff?: string;
}
export interface GitOpsModuleInputDefaults {
  isNamespace: boolean;
  applicationPath: string;
  branch: string;
  layer: GitOpsLayer;
  serverName: string;
  tmpDir: string;
  contentDir: string;
  type: string;
}

export interface GitOpsModuleResult {}

export abstract class GitOpsModuleApi {
  abstract delete(options: GitOpsModuleOptions): Promise<GitOpsModuleResult>;
  abstract populate(options: GitOpsModuleOptions): Promise<GitOpsModuleResult>;
}
