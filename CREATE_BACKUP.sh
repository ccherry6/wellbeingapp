#!/bin/bash

# BDC Thrive - Create Deployment Package
# This script creates a complete backup of your project for deployment

echo "=========================================="
echo "  BDC Thrive - Creating Deployment Package"
echo "=========================================="
echo ""

# Get current date for filename
DATE=$(date +%Y-%m-%d-%H%M)
BACKUP_NAME="BDC-Thrive-$DATE"

echo "Creating backup: $BACKUP_NAME"
echo ""

# Create a temporary directory for the backup
mkdir -p "/tmp/$BACKUP_NAME"

echo "Copying project files..."

# Copy all necessary files
cp -r src "/tmp/$BACKUP_NAME/"
cp -r public "/tmp/$BACKUP_NAME/"
cp -r supabase "/tmp/$BACKUP_NAME/"
cp -r ios "/tmp/$BACKUP_NAME/" 2>/dev/null || echo "Note: iOS folder not found (will be created when needed)"

# Copy configuration files
cp package.json "/tmp/$BACKUP_NAME/"
cp package-lock.json "/tmp/$BACKUP_NAME/"
cp tsconfig.json "/tmp/$BACKUP_NAME/"
cp tsconfig.app.json "/tmp/$BACKUP_NAME/"
cp tsconfig.node.json "/tmp/$BACKUP_NAME/"
cp vite.config.ts "/tmp/$BACKUP_NAME/"
cp tailwind.config.js "/tmp/$BACKUP_NAME/"
cp postcss.config.js "/tmp/$BACKUP_NAME/"
cp index.html "/tmp/$BACKUP_NAME/"
cp capacitor.config.ts "/tmp/$BACKUP_NAME/"
cp .gitignore "/tmp/$BACKUP_NAME/"

# Copy environment file (IMPORTANT!)
if [ -f .env ]; then
    cp .env "/tmp/$BACKUP_NAME/"
    echo "✅ Environment file (.env) included"
else
    echo "⚠️  WARNING: .env file not found!"
fi

# Copy documentation
cp *.md "/tmp/$BACKUP_NAME/" 2>/dev/null

# Copy dist folder if it exists
if [ -d "dist" ]; then
    cp -r dist "/tmp/$BACKUP_NAME/"
    echo "✅ Built website (dist) included"
else
    echo "ℹ️  No dist folder found. Run 'npm run build' to create it."
fi

echo ""
echo "Creating archive..."

# Create ZIP archive
cd /tmp
if command -v zip &> /dev/null; then
    zip -r "$BACKUP_NAME.zip" "$BACKUP_NAME" -q
    echo "✅ Archive created: /tmp/$BACKUP_NAME.zip"
elif command -v tar &> /dev/null; then
    tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
    echo "✅ Archive created: /tmp/$BACKUP_NAME.tar.gz"
else
    echo "❌ No archive tool found. Backup folder created at: /tmp/$BACKUP_NAME"
fi

# Clean up temporary directory
rm -rf "/tmp/$BACKUP_NAME"

echo ""
echo "=========================================="
echo "  Backup Complete!"
echo "=========================================="
echo ""
echo "What's included:"
echo "  ✓ All source code (src/)"
echo "  ✓ Database migrations (supabase/)"
echo "  ✓ iOS project files (ios/)"
echo "  ✓ Configuration files"
echo "  ✓ Environment variables (.env)"
echo "  ✓ Built website (dist/) if available"
echo "  ✓ All documentation"
echo ""
echo "Find your backup at: /tmp/"
echo ""
echo "Next steps:"
echo "  1. Download the backup file to your computer"
echo "  2. Extract it to a safe location"
echo "  3. Follow DEPLOYMENT_QUICK_START.md"
echo ""
