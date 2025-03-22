# Stereotic Headliner

A tool for generating crypto market headlines and reports.

## Running the App

```
bun run headliner.js
```

Or for the diff check version:

```
bun run headliner-diff-check.js
```

## Configuration

Timing intervals can be configured using environment variables:

- `CHECK_INTERVAL_MINUTES`: How often to check for updates (default: 15 minutes)
- `COOLDOWN_MINUTES`: How long to wait after generating a report before checking again (default: 120 minutes / 2 hours)

Example:

```
CHECK_INTERVAL_MINUTES=30 COOLDOWN_MINUTES=180 bun run headliner-diff-check.js
```

You can also set these in a `.env` file.

## Optimizations

The system uses a two-stage approach to minimize LLM API usage:

1. When market data changes, it first generates only a title and summary
2. It checks if the semantic difference exceeds the threshold
3. Only if the difference is significant does it generate a full report

This saves resources by avoiding unnecessary full content generation.
