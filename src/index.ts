import type { Probot } from 'probot';

export function createApp(app: Probot) {
  app.on('issues.opened', async (context) => {
    const issueComment = context.issue({
      body: 'Thanks for opening this issue!'
    });
    await context.octokit.issues.createComment(issueComment);
  });
}
