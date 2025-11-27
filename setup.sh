#!/bin/bash

# Learning Journal - Quick Start Script
# This script helps you get started with the Learning Journal PWA

echo "======================================"
echo "Learning Journal PWA - Quick Start"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 is installed"
echo ""

# Navigate to backend directory
cd backend

# Check if requirements are installed
echo "📦 Checking Flask installation..."
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📥 Installing Flask and dependencies..."
    pip3 install -r requirements.txt
else
    echo "✅ Flask is already installed"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "You can now:"
echo ""
echo "1. Create entries via command line:"
echo "   cd backend && python3 save_entry.py"
echo ""
echo "2. Start the API server:"
echo "   cd backend && python3 api.py"
echo ""
echo "3. Open journal.html in your browser"
echo ""
echo "For API mode, edit js/storage.js and set:"
echo "   USE_API: true"
echo ""
echo "======================================"
