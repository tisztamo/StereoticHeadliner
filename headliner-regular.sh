#!/bin/bash

# Initialize failure counter
fail_count=0

# Loop until there are 10 consecutive failures
while [ $fail_count -lt 10 ]; do
  # Run the command
  bun run headliner.js
  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    # Reset failure counter on success
    fail_count=0
    echo "Command succeeded. Waiting 60 minutes before next run."
    sleep 3600  # Sleep for 60 minutes (3600 seconds)
  else
    # Increment failure counter on error
    ((fail_count++))
    echo "Command failed (attempt $fail_count/10). Waiting 10 minutes before retrying."
    sleep 600   # Sleep for 10 minutes (600 seconds)
  fi
done

echo "Script stopped after 10 consecutive failures."

