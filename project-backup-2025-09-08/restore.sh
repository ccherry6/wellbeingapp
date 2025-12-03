#!/bin/bash
# BDC Wellbeing Monitor - Restoration Script
# Run this script to restore the project

echo "🔄 Restoring BDC Wellbeing Monitor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    echo "⚠️  Creating .env template..."
    cat > .env << EOL
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOL
    echo "📝 Please update .env with your Supabase credentials"
fi

echo "✅ Restoration complete!"
echo "📋 Next steps:"
echo "   1. Update .env with your Supabase credentials"
echo "   2. Set up Supabase database using migration files"
echo "   3. Run 'npm run dev' to start development server"
echo "   4. Run 'npm run build' to build for production"
