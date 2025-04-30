#!/bin/bash

# Simple script to run tests using Vitest

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running LocalSpot tests...${NC}"
echo "=================================="

# Check if specific tests are requested
if [ "$1" ]; then
  TEST_PATTERN="$1"
  echo -e "${YELLOW}Running tests matching: ${TEST_PATTERN}${NC}"
  npx vitest run "$TEST_PATTERN"
else
  # Run all tests
  echo -e "${YELLOW}Running all tests...${NC}"
  npx vitest run
fi

# Capture exit code
EXIT_CODE=$?

echo "=================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}Some tests failed.${NC}"
fi

# To run tests with coverage
if [ "$1" == "--coverage" ]; then
  echo -e "${YELLOW}Generating coverage report...${NC}"
  npx vitest run --coverage
fi

exit $EXIT_CODE