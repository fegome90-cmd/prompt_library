# Justfile - Developer Commands
# 
# Usage: just <recipe>
#
# Install just: brew install just

# Default recipe
default:
    @just --list

# =============================================================================
# INSTALL & SETUP
# =============================================================================

# Install all dependencies
install:
    bun install

# Generate Prisma client
prisma-generate:
    bunx prisma generate

# Push database schema
prisma-push:
    bunx prisma db push

# Reset database (⚠️ destructive)
prisma-reset:
    bunx prisma migrate reset --force

# Seed database
seed:
    curl -X POST http://localhost:3000/api/seed

# Setup: install + generate + push + seed
setup: install prisma-generate prisma-push seed
    @echo "✅ Setup complete!"

# =============================================================================
# DEVELOPMENT
# =============================================================================

# Start development server
dev:
    bun run dev

# Start production server
start:
    bun run start

# Build for production
build:
    bun run build

# =============================================================================
# TESTING
# =============================================================================

# Run all tests
test:
    bun test

# Run tests with coverage
test-coverage:
    bun test --coverage

# Run tests in watch mode
test-watch:
    bun test --watch

# Run integration tests (requires database)
test-integration:
    @echo "Running integration tests..."
    DATABASE_URL="file:./test.db" bun test

# =============================================================================
# LINTING & FORMATTING
# =============================================================================

# Run ESLint
lint:
    bun run lint

# Type check with TypeScript
typecheck:
    bunx tsc --noEmit

# Check Justfile syntax (dry run)
just-check:
    @echo "Checking Justfile syntax..."
    just --dry-run --unstable

# Format Justfile (install: cargo install justfmt)
just-fmt:
    @echo "Formatting Justfile..."
    @justfmt --write Justfile || echo "Install justfmt: cargo install justfmt"

# Lint Justfile - check for common issues
just-lint:
    @echo "Linting Justfile..."
    @grep -n '\\$' Justfile || true
    @echo "✅ Justfile check complete"

# =============================================================================
# PREMIUM QUALITY AUDIT
# =============================================================================

# Run Design & Performance audit (Modern AST-based)
audit:
    @echo "🚀 Starting Premium Quality Audit (ESLint + Stylelint)..."
    @bun run lint
    @bunx stylelint "**/*.css"

# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

# Open Prisma Studio (database GUI)
studio:
    bunx prisma studio

# Create migration
migrate name="":
    bunx prisma migrate dev --name {{name}}

# =============================================================================
# CLEANUP
# =============================================================================

# Clean node_modules and reinstall
reinstall:
    rm -rf node_modules bun.lockb
    bun install

# Clean build artifacts
clean:
    rm -rf .next
    rm -rf coverage

# =============================================================================
# UTILITIES
# =============================================================================

# Check Node.js version
node-version:
    node --version

# Check Bun version
bun-version:
    bun --version

# Show environment info
info: node-version bun-version
    @echo "NODE_ENV: $NODE_ENV"

# =============================================================================
# DOCKER
# =============================================================================

# Build Docker image
docker-build:
    docker build -t prompt-library .

# Run Docker container
docker-run:
    docker run -p 3000:3000 prompt-library

# =============================================================================
# DEBUGGING
# =============================================================================

# Show git status
git-status:
    git status

# Show recent commits
git-log:
    git log --oneline -10

# Show branches
git-branches:
    git branch -a
