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

## Email Notifications

The system can automatically send email notifications when new reports are generated:

1. Copy the `.env.template` file to `.env` and configure the email settings:
   - `SOURCE_EMAIL`: Your Gmail address
   - `GOOGLE_APP_PASSWORD`: Your Google app password (not your regular password)
   - `TARGET_EMAIL`: Recipient email address

2. To generate a Google app password:
   - Go to your Google Account > Security > 2-Step Verification
   - Scroll down to "App passwords" 
   - Generate a new app password for "Mail" and your device

The HTML report will be sent as the email body with the report title as the subject.

## Optimizations

The system uses a two-stage approach to minimize LLM API usage:

1. When market data changes, it first generates only a title and summary
2. It checks if the semantic difference compared to the last generated report exceeds the threshold
3. Only if the difference is significant does it generate a full report

The comparison baseline is always the last successfully generated report, not intermediate LLM outputs. This ensures we're measuring meaningful changes from the last published content rather than from potentially discarded drafts.

This approach saves resources by avoiding unnecessary full content generation.
