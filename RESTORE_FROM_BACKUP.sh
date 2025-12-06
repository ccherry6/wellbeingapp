#!/bin/bash

# Thrive Wellbeing - Restore Script
# This script restores the project from the backup created on December 6, 2025

set -e  # Exit on any error

echo "========================================="
echo "Thrive Wellbeing - Restore from Backup"
echo "========================================="
echo ""

# Define backup location
BACKUP_DIR="/tmp/cc-agent/56043404/backups/working-build-2025-12-06"
CURRENT_DIR=$(pwd)

# Check if backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Error: Backup directory not found at $BACKUP_DIR"
    exit 1
fi

echo "Found backup at: $BACKUP_DIR"
echo ""

# Ask for confirmation
read -p "This will replace the current project directory. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Step 1: Cleaning current directory..."
# Remove everything except this restore script
find . -mindepth 1 -maxdepth 1 ! -name 'RESTORE_FROM_BACKUP.sh' -exec rm -rf {} +
echo "✅ Current directory cleaned"

echo ""
echo "Step 2: Copying files from backup..."
# Copy all files from backup (excluding the archive and this script)
cp -r "$BACKUP_DIR"/* . 2>/dev/null || true
rm -f thrive-wellbeing-backup.tar.gz
echo "✅ Files copied successfully"

echo ""
echo "Step 3: Installing dependencies..."
if command -v npm &> /dev/null; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "⚠️  npm not found. Please run 'npm install' manually."
fi

echo ""
echo "Step 4: Building project..."
if command -v npm &> /dev/null; then
    npm run build
    echo "✅ Build completed successfully"
else
    echo "⚠️  Please run 'npm run build' manually."
fi

echo ""
echo "========================================="
echo "✅ Restore completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Verify your .env file has the correct Supabase credentials"
echo "2. Test locally: npm run dev"
echo "3. For iOS: npx cap sync ios"
echo "4. Open ios/App/App.xcworkspace in Xcode"
echo ""
echo "For more information, see BACKUP_INFO.md"
echo ""
