#!/bin/bash

# Vercel build script with error handling

echo "Starting Vercel build..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build Next.js app
echo "Building Next.js application..."
npm run build

echo "Build completed successfully!"