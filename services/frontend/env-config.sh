#!/bin/sh

# Output file path
OUTPUT_FILE="./public/env-config.js"

# Create/Clear the file
echo "window._env_ = {" > $OUTPUT_FILE

# List of variables to inject
VARS="NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID NEXT_PUBLIC_USER_SERVICE_URL NEXT_PUBLIC_QUESTION_SERVICE_URL NEXT_PUBLIC_PARTYKIT_HOST"

for varname in $VARS; do
    # Get the value of the variable
    value=$(eval echo \$$varname)
    # Add to the JS file
    echo "  $varname: \"$value\"," >> $OUTPUT_FILE
done

echo "};" >> $OUTPUT_FILE