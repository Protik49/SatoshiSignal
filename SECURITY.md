# Security Practices

## API Keys

- **Never commit `.env` files** — they are in `.gitignore` and must stay that way
- **Use `.env.example` as a template** — it contains no real keys, only placeholders
- **Required keys** (`GEMINI_API_KEY`) will cause the app to fail immediately if missing
- **Optional keys** (`NEWSDATA_API_KEY`, `OPENROUTER_API_KEY`) log a warning and disable the feature gracefully
- **Keys are validated on startup** — format is checked (e.g., Gemini keys must match `AIza...` pattern)
- **Keys are masked in logs** — only first 4 and last 4 characters are shown (e.g., `AIza...PGIw`)

## CORS

`CORS_ORIGINS` defaults to `localhost:3000`. Do not set it to `*` in production.

## What Gets Logged

- API key presence/absence (masked values)
- Connection status to Binance WebSocket
- NewsData.io fetch success/failure
- AI prediction engine initialization status
- **No API keys, tokens, or user data are ever logged in full**

## For Hackathon Demos

If you need to share your environment:
1. Share only `.env.example`
2. Communicate keys out-of-band (DM, password manager, etc.)
3. Rotate keys after the event