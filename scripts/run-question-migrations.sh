#!/bin/bash

# Script to run database migrations for question templates
# This script populates the QuestionTemplate and OptionTemplate tables

echo "Running database migrations for question templates..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the migrations
echo "Running Technical Feasibility questions migration..."
psql $DATABASE_URL -f prisma/migrations/001_populate_technical_feasibility_questions.sql

if [ $? -eq 0 ]; then
    echo "✅ Technical Feasibility questions migration completed successfully"
else
    echo "❌ Technical Feasibility questions migration failed"
    exit 1
fi

echo "Running Business Feasibility questions migration..."
psql $DATABASE_URL -f prisma/migrations/002_populate_business_feasibility_questions.sql

if [ $? -eq 0 ]; then
    echo "✅ Business Feasibility questions migration completed successfully"
else
    echo "❌ Business Feasibility questions migration failed"
    exit 1
fi

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the API endpoint: GET /api/questions?stage=TECHNICAL_FEASIBILITY"
echo "2. Test the API endpoint: GET /api/questions?stage=BUSINESS_FEASIBILITY"
echo "3. Verify the components load questions dynamically"
