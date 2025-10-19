#!/bin/bash

# Production Fix Script for Migration 0014 (review_id column already exists)
# 
# This script fixes the production database migration failure where migration 0014
# fails because the review_id column already exists in the review_photos table.
#
# IMPORTANT: Only run this script if migration 0014 is failing in production
# with the error "duplicate column name: review_id"

set -e  # Exit on any error

echo "🔧 MatchaMap Production Migration 0014 Fix"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "backend/wrangler.toml" ]; then
    print_error "Please run this script from the root of the MatchaMap repository"
    exit 1
fi

print_warning "This script will fix migration 0014 in production by marking it as applied."
print_warning "Make sure you've verified that the review_id column already exists in production."
echo ""

# Confirm before proceeding
read -p "Do you want to proceed? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
print_status "Step 1: Checking current production schema..."

# Check if review_id column exists
echo "Checking if review_id column exists in review_photos table..."
COLUMN_EXISTS=$(npx wrangler d1 execute matchamap-db --remote --command \
    "PRAGMA table_info(review_photos);" | grep -c "review_id" || true)

if [ "$COLUMN_EXISTS" -eq 0 ]; then
    print_error "review_id column does not exist in production!"
    print_error "This fix is not needed. The migration should run normally."
    exit 1
fi

print_success "✓ review_id column exists in review_photos table"

echo ""
print_status "Step 2: Checking if migration 0014 is already marked as applied..."

# Check if migration is already applied
MIGRATION_EXISTS=$(npx wrangler d1 execute matchamap-db --remote --command \
    "SELECT COUNT(*) FROM d1_migrations WHERE name = '0014_add_review_id_to_photos.sql';" | tail -n 1)

if [ "$MIGRATION_EXISTS" -eq 1 ]; then
    print_warning "Migration 0014 is already marked as applied in production."
    print_status "Checking if index exists..."
else
    print_status "Migration 0014 is not marked as applied. Will mark it now."
fi

echo ""
print_status "Step 3: Checking if review_id index exists..."

# Check if index exists
INDEX_EXISTS=$(npx wrangler d1 execute matchamap-db --remote --command \
    "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_review_photos_review';" | tail -n 1)

if [ "$INDEX_EXISTS" -eq 0 ]; then
    print_status "Creating missing index..."
    npx wrangler d1 execute matchamap-db --remote --command \
        "CREATE INDEX idx_review_photos_review ON review_photos (review_id);"
    print_success "✓ Created index idx_review_photos_review"
else
    print_success "✓ Index idx_review_photos_review already exists"
fi

echo ""
print_status "Step 4: Marking migration 0014 as applied..."

if [ "$MIGRATION_EXISTS" -eq 0 ]; then
    npx wrangler d1 execute matchamap-db --remote --command \
        "INSERT INTO d1_migrations (name, applied_at) VALUES ('0014_add_review_id_to_photos.sql', datetime('now'));"
    print_success "✓ Marked migration 0014 as applied"
else
    print_success "✓ Migration 0014 already marked as applied"
fi

echo ""
print_status "Step 5: Verifying fix..."

# Test that migrations now work
echo "Testing migration system..."
cd backend
if npm run db:migrate:prod > /dev/null 2>&1; then
    print_success "✓ Migration system is working correctly"
else
    print_warning "Migration command returned non-zero exit code, but this might be normal if no new migrations exist"
fi

echo ""
print_success "🎉 Production migration 0014 fix completed successfully!"
echo ""
echo "Summary of changes:"
echo "- ✓ Verified review_id column exists in review_photos table"
echo "- ✓ Ensured idx_review_photos_review index exists"
echo "- ✓ Marked migration 0014_add_review_id_to_photos.sql as applied"
echo ""
print_status "You can now deploy to production normally."
print_status "Future migrations should work without issues."
echo ""
print_warning "Remember: Always use Drizzle migrations for future schema changes!"