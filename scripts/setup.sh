#!/bin/bash

# LabCaptureBot - Setup Script
# Run this to setup the project for the first time

set -e

echo "🤖 LabCaptureBot - Setup Script"
echo "================================"
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20+. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"
echo ""

# Check PostgreSQL
echo "🐘 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL 15+"
    exit 1
fi
echo "✅ PostgreSQL installed"
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi
echo "✅ Docker installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create database
echo "🗄️  Creating database..."
if psql -lqt | cut -d \| -f 1 | grep -qw labcapture; then
    echo "⚠️  Database 'labcapture' already exists"
else
    createdb labcapture
    echo "✅ Database created"
fi
echo ""

# Start MinIO
echo "🗂️  Starting MinIO..."
if docker ps | grep -q labcapture-minio; then
    echo "⚠️  MinIO container already running"
elif docker ps -a | grep -q labcapture-minio; then
    docker start labcapture-minio
    echo "✅ MinIO container started"
else
    docker run -d \
      -p 9000:9000 \
      -p 9001:9001 \
      --name labcapture-minio \
      -e "MINIO_ROOT_USER=minioadmin" \
      -e "MINIO_ROOT_PASSWORD=minioadmin" \
      quay.io/minio/minio server /data --console-address ":9001"
    echo "✅ MinIO container created and started"
fi
echo ""

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f api/.env ]; then
    cat > api/.env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/labcapture
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=lab-capture-cases
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CASE_AUTO_CLOSE_MINUTES=10
EOF
    echo "✅ Created api/.env"
else
    echo "⚠️  api/.env already exists"
fi

if [ ! -f bot/.env ]; then
    echo "⚠️  bot/.env not found. Please create it manually with your Telegram token"
    echo "   See bot/.env.example for reference"
else
    echo "✅ bot/.env exists"
fi
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate --workspace=api
echo "✅ Migrations completed"
echo ""

echo "================================"
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify bot/.env has your Telegram token"
echo "2. Start the API:  npm run dev:api"
echo "3. Start the Bot:  npm run dev:bot"
echo ""
echo "MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "API Health:    http://localhost:3000/api/health"
echo ""
echo "Happy coding! 🚀"
