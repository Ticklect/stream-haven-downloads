#!/bin/bash

echo "Installing StreamHaven Desktop App..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "npm is not available. Please install Node.js with npm."
    exit 1
fi

echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo
    echo "Installation failed. Trying with different package manager..."
    
    # Try bun if available
    if command -v bun &> /dev/null; then
        echo "Using bun package manager..."
        bun install
    else
        # Try yarn
        echo "Installing with yarn..."
        npm install -g yarn > /dev/null 2>&1
        yarn install
    fi
fi

echo
echo "Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed. Please check the error messages above."
    exit 1
fi

echo
echo "Installation completed successfully!"
echo
echo "To start the app:"
echo "  - Development mode: npm run dev"
echo "  - Desktop app: npm run electron"
echo

# Make the script executable
chmod +x install.sh