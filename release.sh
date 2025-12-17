
#!/usr/bin/env bash
# Manual release script that replicates the GitHub Actions release workflow
# Usage: ./release.sh

set -e

echo "======================================"
echo "FormatJS Manual Release Script"
echo "======================================"
echo ""

# Check if we're on the main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Warning: You are not on the main branch (current: $CURRENT_BRANCH)"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  Warning: You have uncommitted changes"
  git status --short
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "Step 1: Building Distribution with Bazel"
echo "Running: bazel build :dist"
bazel build :dist
echo "✓ Distribution built"
echo ""

echo "Step 2: Copying build artifacts to release directory"
rm -rf release/
cp -rf $(bazel cquery --output=files dist)/ release/
chmod -R +w release/
echo "✓ Artifacts copied to release/"
echo ""

echo "Step 3: Installing release dependencies"
cd release
pnpm install --frozen-lockfile --ignore-scripts
echo "✓ Dependencies installed"
echo ""

cd ..

echo "Step 4: npm authentication"
echo "Checking npm authentication..."
if npm whoami > /dev/null 2>&1; then
  echo "✓ Already logged in as: $(npm whoami)"
else
  echo "⚠️  Not logged in to npm"
  read -p "Run 'npm adduser' now? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm adduser
    echo "✓ npm authentication successful"
  else
    echo "❌ npm authentication required for publishing"
    exit 1
  fi
fi
echo ""

echo "Step 5: Publishing to npm"
echo "⚠️  This will publish all packages to npm!"
read -p "Continue with publishing? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Publishing cancelled"
  exit 0
fi

cd release
pnpm -r publish --access public --no-git-checks
cd ..

echo ""
echo "======================================"
echo "✅ Release completed successfully!"
echo "======================================"