import { readFileSync } from 'fs';
import nock from 'nock';
import { join } from 'path';
import { Probot, ProbotOctokit } from 'probot';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src';
import { issuesOpenedPayload } from './shared/payloads/issues-opened';

const issueCreatedBody = { body: 'Thanks for opening this issue!' };

const privateKey = readFileSync(join(__dirname, 'shared/mock-cert.pem'), 'utf-8');

let probot: Probot;

beforeEach(() => {
  nock.disableNetConnect();
  probot = new Probot({
    appId: 123,
    privateKey,
    // disable request throttling and retries for testing
    Octokit: ProbotOctokit.defaults({
      retry: { enabled: false },
      throttle: { enabled: false }
    })
  });
  probot.load(createApp);
});

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('Zotera Plugins Bot', () => {
  it('creates a comment when an issue is opened', async () => {
    const mock = nock('https://api.github.com')
      // Test that we correctly return a test token
      .post('/app/installations/2/access_tokens')
      .reply(200, {
        token: 'test',
        permissions: {
          issues: 'write'
        }
      })

      // Test that a comment is posted
      .post('/repos/hiimbex/testing-things/issues/1/comments', (body: any) => {
        expect(body).toMatchObject(issueCreatedBody);
        return true;
      })
      .reply(200);

    const event = {
      name: 'issues',
      payload: issuesOpenedPayload
    };

    await probot.receive(event as any);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });
});
