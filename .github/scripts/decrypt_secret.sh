#!/bin/sh

# Decrypt the file
# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$SECRET_BAZEL_CACHE_JSON_PASSPHRASE" \
--output $GITHUB_WORKSPACE/../secret.json secret.json.gpg