# Facebook Page Comment Automation Tool

A simple Python automation script that helps you respond to Facebook Page comments using the Facebook Graph API.

## Features
- Polls recent posts and comments from a Facebook Page.
- Matches comment text against keyword rules.
- Auto-replies with predefined responses.
- Keeps local state to avoid duplicate replies.
- Supports one-time mode and interval loop mode.
- Includes `--dry-run` for safe testing.

## Setup
1. Create and activate a Python virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment variables from `.env.example`.
4. Update `rules.example.yml` with your own response logic.

## Usage
Run once:
```bash
python facebook_comment_responder.py --rules rules.example.yml --dry-run
```

Run continuously every 120 seconds:
```bash
python facebook_comment_responder.py --rules rules.example.yml --interval 120
```

Useful flags:
- `--posts-limit 5`: Number of recent posts to inspect per iteration.
- `--comments-limit 50`: Number of comments to inspect per post.
- `--state .state/replied_comments.json`: State file for replied comment IDs.
- `--log-level DEBUG`: Verbose logging.

## Facebook API Notes
- You need a Facebook App and permissions such as `pages_manage_engagement` and relevant Page access token scopes.
- Use a long-lived Page access token for production.
- Respect Facebook Platform Policies and anti-spam rules.

## Next improvements
- Add sentiment moderation before replying.
- Add webhook mode (real-time) instead of polling.
- Add OpenAI/LLM response generation with guardrails.
- Store state in a database for multi-instance deployments.
