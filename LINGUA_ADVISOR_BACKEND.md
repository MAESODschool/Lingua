# Lingua Advisor Backend

Lingua Advisor keeps its local mock mode so the game continues to work on GitHub Pages and offline classroom demos. The optional AI mode uses the serverless endpoint at `api/lingua-advisor.js`.

## Deployment

1. Deploy this repository to a Node serverless host that supports a Vercel-style `api` directory.
2. Add `OPENAI_API_KEY` to the host environment. Never put the real key in this repository or in browser code.
3. Optionally set `OPENAI_MODEL`; the default is `gpt-5`.
4. Set `LINGUA_ALLOWED_ORIGINS` to a comma-separated list of the exact game origins allowed to call the endpoint.
5. Leave `LINGUA_ADVISOR_SHARED_SECRET` empty for direct browser use. A browser cannot keep a shared secret private; only enable it behind a trusted server-side proxy.
6. In `index.html`, set `lingua-advisor-api-url` to the deployed endpoint and keep `lingua-advisor-mode` as `auto` or change it to `backend`.

Example for a same-origin deployment:

```html
<meta name="lingua-advisor-mode" content="auto">
<meta name="lingua-advisor-api-url" content="/api/lingua-advisor">
```

For a separate backend deployment, use the full HTTPS endpoint and add the GitHub Pages origin to `LINGUA_ALLOWED_ORIGINS`.

## Modes

- `mock`: always uses the built-in local response.
- `auto`: calls the backend when an API URL is configured and falls back to the local response when unavailable.
- `backend`: requires the configured backend and shows a retry message when it is unavailable.

GitHub Pages alone cannot protect `OPENAI_API_KEY`, so the repository defaults to `auto` with an empty API URL. That behaves as local mock mode until a secure backend is configured.

The endpoint accepts only scoped Advisor data, limits messages and request size, strips answers before a battle question is completed, does not store OpenAI responses, and does not write game progress.
