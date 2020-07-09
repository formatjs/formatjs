#!/bin/sh

# Decrypt the file
mkdir $HOME/secrets
# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$SECRET_BAZEL_CACHE_JSON_PASSPHRASE" \
--output $HOME/secrets/secret.json secret.json.gpg