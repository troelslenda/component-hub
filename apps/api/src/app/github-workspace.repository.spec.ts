import { ServiceUnavailableException } from '@nestjs/common';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GithubWorkspaceRepository } from './github-workspace.repository';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('GithubWorkspaceRepository', () => {
  let keyDirectory: string;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    keyDirectory = mkdtempSync(join(tmpdir(), 'component-hub-github-'));
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const keyPath = join(keyDirectory, 'app.pem');
    writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
    Object.assign(process.env, {
      GITHUB_APP_ID: '123',
      GITHUB_APP_INSTALLATION_ID: '456',
      GITHUB_APP_PRIVATE_KEY_PATH: keyPath,
      GITHUB_OWNER: 'test-owner',
      GITHUB_REPOSITORY: 'test-repository',
      GITHUB_DEFAULT_BRANCH: 'main',
    });
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    rmSync(keyDirectory, { recursive: true, force: true });
    delete process.env.GITHUB_APP_ID;
    delete process.env.GITHUB_APP_INSTALLATION_ID;
    delete process.env.GITHUB_APP_PRIVATE_KEY_PATH;
  });

  it('reports missing GitHub App configuration', async () => {
    delete process.env.GITHUB_APP_ID;
    const repository = new GithubWorkspaceRepository();

    await expect(repository.list('date-range-picker')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps open pull requests to component workspaces', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'installation-token', expires_at: '2099-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(jsonResponse([
        {
          html_url: 'https://github.com/test-owner/test-repository/pull/7',
          title: '[date-range-picker] Keyboard behavior',
          body: '<!-- component-hub:component=date-range-picker -->\n<!-- component-hub:description=Improve%20keys -->',
          draft: false,
          head: { ref: 'workspace/date-range-picker/keyboard-behavior' },
        },
      ]));

    const result = await new GithubWorkspaceRepository().list('date-range-picker');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'keyboard-behavior',
        componentId: 'date-range-picker',
        name: 'Keyboard behavior',
        description: 'Improve keys',
        status: 'review',
      }),
    ]);
  });

  it('returns the existing workspace without creating a duplicate branch or pull request', async () => {
    const existingPull = {
      html_url: 'https://github.com/test-owner/test-repository/pull/8',
      title: '[notification-banner] Accessible alerts',
      body: '<!-- component-hub:component=notification-banner -->',
      draft: true,
      head: { ref: 'workspace/notification-banner/accessible-alerts' },
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'installation-token', expires_at: '2099-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(jsonResponse([existingPull]));

    const result = await new GithubWorkspaceRepository().create({
      componentId: 'notification-banner',
      name: 'Accessible alerts',
      description: 'Explore screen readers.',
    });

    expect(result.pullRequestUrl).toBe(existingPull.html_url);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain('head=test-owner%3Aworkspace%2Fnotification-banner%2Faccessible-alerts');
  });

  it('creates a branch and draft pull request for a new workspace', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'installation-token', expires_at: '2099-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'base-sha' } }))
      .mockResolvedValueOnce(jsonResponse({ ref: 'refs/heads/workspace/date-range-picker/new-calendar' }, 201))
      .mockResolvedValueOnce(jsonResponse({ content: { path: '.component-hub/workspaces/date-range-picker/new-calendar.json' } }, 201))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({
        html_url: 'https://github.com/test-owner/test-repository/pull/9',
        title: '[date-range-picker] New calendar',
        body: '<!-- component-hub:component=date-range-picker -->',
        draft: true,
        head: { ref: 'workspace/date-range-picker/new-calendar' },
      }, 201));

    const result = await new GithubWorkspaceRepository().create({
      componentId: 'date-range-picker',
      name: 'New calendar',
      description: 'Try another layout.',
    });

    expect(result.branch).toBe('workspace/date-range-picker/new-calendar');
    const branchRequest = fetchMock.mock.calls[3][1];
    expect(JSON.parse(branchRequest?.body as string)).toEqual({
      ref: 'refs/heads/workspace/date-range-picker/new-calendar',
      sha: 'base-sha',
    });
    const manifestRequest = fetchMock.mock.calls[4];
    expect(manifestRequest[0]).toContain('/contents/.component-hub/workspaces/date-range-picker/new-calendar.json');
    expect(JSON.parse(manifestRequest[1]?.body as string)).toEqual(expect.objectContaining({
      branch: 'workspace/date-range-picker/new-calendar',
    }));
    const pullRequest = fetchMock.mock.calls[6][1];
    expect(JSON.parse(pullRequest?.body as string)).toEqual(expect.objectContaining({
      head: 'workspace/date-range-picker/new-calendar',
      base: 'main',
      draft: true,
    }));
  });

  it('returns a pull request created concurrently instead of failing the retry', async () => {
    const concurrentPull = {
      html_url: 'https://github.com/test-owner/test-repository/pull/10',
      title: '[date-range-picker] Concurrent work',
      body: '<!-- component-hub:component=date-range-picker -->',
      draft: true,
      head: { ref: 'workspace/date-range-picker/concurrent-work' },
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: 'installation-token', expires_at: '2099-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'base-sha' } }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Reference already exists' }, 422))
      .mockResolvedValueOnce(jsonResponse({ content: { path: '.component-hub/workspaces/date-range-picker/concurrent-work.json' } }, 201))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ message: 'A pull request already exists' }, 422))
      .mockResolvedValueOnce(jsonResponse([concurrentPull]));

    const result = await new GithubWorkspaceRepository().create({
      componentId: 'date-range-picker',
      name: 'Concurrent work',
    });

    expect(result.pullRequestUrl).toBe(concurrentPull.html_url);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});
