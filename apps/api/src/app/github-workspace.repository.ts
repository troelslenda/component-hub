import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  CreateWorkspaceCommand,
  WorkspaceRecord,
  WorkspaceRepository,
} from './workspaces.service';

interface GithubConfig {
  appId: string;
  installationId: string;
  privateKey: string;
  owner: string;
  repository: string;
  defaultBranch: string;
}

interface GithubPullRequest {
  html_url: string;
  title: string;
  body: string | null;
  draft: boolean;
  head: { ref: string };
}

const WORKSPACE_PREFIX = 'workspace/';
const COMPONENT_MARKER = '<!-- component-hub:component=';
const DESCRIPTION_MARKER = '<!-- component-hub:description=';

@Injectable()
export class GithubWorkspaceRepository implements WorkspaceRepository {
  private installationToken: { value: string; expiresAt: number } | undefined;

  async list(componentId: string): Promise<WorkspaceRecord[]> {
    const config = this.getConfig();
    const pulls = await this.request<GithubPullRequest[]>(
      config,
      `/repos/${config.owner}/${config.repository}/pulls?state=open&per_page=100`,
    );

    return pulls
      .filter((pull) => this.componentId(pull) === componentId)
      .map((pull) => this.toWorkspace(pull, componentId));
  }

  async create(command: CreateWorkspaceCommand): Promise<WorkspaceRecord> {
    const config = this.getConfig();
    const id = this.slugify(command.name);
    const branch = `${WORKSPACE_PREFIX}${command.componentId}/${id}`;
    const existing = await this.findPullRequest(config, branch);
    if (existing) return this.toWorkspace(existing, command.componentId);

    const base = await this.request<{ object: { sha: string } }>(
      config,
      `/repos/${config.owner}/${config.repository}/git/ref/heads/${this.path(config.defaultBranch)}`,
    );

    await this.request(
      config,
      `/repos/${config.owner}/${config.repository}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }),
      },
      [422],
    );

    await this.createWorkspaceManifest(config, command, id, branch);

    const afterBranchCreation = await this.findPullRequest(config, branch);
    if (afterBranchCreation) {
      return this.toWorkspace(afterBranchCreation, command.componentId);
    }

    const pull = await this.request<GithubPullRequest | undefined>(
      config,
      `/repos/${config.owner}/${config.repository}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: `[${command.componentId}] ${command.name}`,
          head: branch,
          base: config.defaultBranch,
          draft: true,
          body: this.pullRequestBody(command),
        }),
      },
      [422],
    );
    if (!pull) {
      const concurrentlyCreated = await this.findPullRequest(config, branch);
      if (concurrentlyCreated) return this.toWorkspace(concurrentlyCreated, command.componentId);
      throw new BadGatewayException({
        code: 'GITHUB_PULL_REQUEST_CONFLICT',
        message: 'GitHub rejected the pull request and no existing workspace was found.',
      });
    }
    return this.toWorkspace(pull, command.componentId);
  }

  private getConfig(): GithubConfig {
    const appId = process.env.GITHUB_APP_ID;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
    if (!appId || !installationId || !privateKeyPath) {
      throw new ServiceUnavailableException({
        code: 'GITHUB_NOT_CONFIGURED',
        message: 'GitHub App workspace creation is not configured yet.',
      });
    }

    try {
      return {
        appId,
        installationId,
        privateKey: readFileSync(privateKeyPath, 'utf8'),
        owner: process.env.GITHUB_OWNER || 'troelslenda',
        repository: process.env.GITHUB_REPOSITORY || 'component-hub',
        defaultBranch: process.env.GITHUB_DEFAULT_BRANCH || 'main',
      };
    } catch {
      throw new ServiceUnavailableException({
        code: 'GITHUB_PRIVATE_KEY_UNAVAILABLE',
        message: 'The configured GitHub App private key could not be read.',
      });
    }
  }

  private async findPullRequest(
    config: GithubConfig,
    branch: string,
  ): Promise<GithubPullRequest | undefined> {
    const head = encodeURIComponent(`${config.owner}:${branch}`);
    const pulls = await this.request<GithubPullRequest[]>(
      config,
      `/repos/${config.owner}/${config.repository}/pulls?state=open&head=${head}`,
    );
    return pulls[0];
  }

  private async request<T = unknown>(
    config: GithubConfig,
    endpoint: string,
    init: RequestInit = {},
    acceptedErrors: number[] = [],
  ): Promise<T> {
    const token = await this.getInstallationToken(config);
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...init.headers,
      },
    });
    if (acceptedErrors.includes(response.status)) return undefined as T;
    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException({
        code: 'GITHUB_REQUEST_FAILED',
        message: `GitHub returned ${response.status}.`,
        detail: detail.slice(0, 500),
      });
    }
    return (await response.json()) as T;
  }

  private async getInstallationToken(config: GithubConfig): Promise<string> {
    if (this.installationToken && this.installationToken.expiresAt > Date.now() + 60_000) {
      return this.installationToken.value;
    }
    const response = await fetch(
      `https://api.github.com/app/installations/${config.installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.appJwt(config)}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'GITHUB_AUTHENTICATION_FAILED',
        message: `GitHub App authentication returned ${response.status}.`,
      });
    }
    const result = (await response.json()) as { token: string; expires_at: string };
    this.installationToken = {
      value: result.token,
      expiresAt: new Date(result.expires_at).getTime(),
    };
    return result.token;
  }

  private appJwt(config: GithubConfig): string {
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: config.appId })}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(config.privateKey, 'base64url');
    return `${unsigned}.${signature}`;
  }

  private pullRequestBody(command: CreateWorkspaceCommand): string {
    return [
      `Component Hub workspace for **${command.componentId}**.`,
      '',
      command.description || 'No description provided.',
      '',
      `${COMPONENT_MARKER}${encodeURIComponent(command.componentId)} -->`,
      `${DESCRIPTION_MARKER}${encodeURIComponent(command.description || '')} -->`,
    ].join('\n');
  }

  private async createWorkspaceManifest(
    config: GithubConfig,
    command: CreateWorkspaceCommand,
    id: string,
    branch: string,
  ): Promise<void> {
    const manifestPath = `.component-hub/workspaces/${command.componentId}/${id}.json`;
    const manifest = JSON.stringify(
      {
        id,
        componentId: command.componentId,
        name: command.name,
        description: command.description || '',
        branch,
      },
      null,
      2,
    );
    await this.request(
      config,
      `/repos/${config.owner}/${config.repository}/contents/${this.path(manifestPath)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: `chore: initialize ${command.name} workspace`,
          content: Buffer.from(`${manifest}\n`).toString('base64'),
          branch,
        }),
      },
      [422],
    );
  }

  private componentId(pull: GithubPullRequest): string | undefined {
    const marked = pull.body?.match(/<!-- component-hub:component=([^ ]+) -->/)?.[1];
    if (marked) return decodeURIComponent(marked);
    if (!pull.head.ref.startsWith(WORKSPACE_PREFIX)) return undefined;
    return pull.head.ref.slice(WORKSPACE_PREFIX.length).split('/')[0];
  }

  private toWorkspace(pull: GithubPullRequest, componentId: string): WorkspaceRecord {
    const id = pull.head.ref.split('/').at(-1) || pull.head.ref;
    const encodedDescription = pull.body?.match(/<!-- component-hub:description=([^ ]*) -->/)?.[1];
    return {
      id,
      componentId,
      name: pull.title.replace(/^\[[^\]]+\]\s*/, ''),
      description: encodedDescription ? decodeURIComponent(encodedDescription) : '',
      branch: pull.head.ref,
      pullRequestUrl: pull.html_url,
      status: pull.draft ? 'active' : 'review',
    };
  }

  private slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private path(value: string): string {
    return value.split('/').map(encodeURIComponent).join('/');
  }
}
