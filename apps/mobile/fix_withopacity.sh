#!/bin/bash

# Fix withOpacity() -> withValues() deprecation

echo "Fixing deprecated withOpacity() calls..."

# Use sed to replace withOpacity with withValues
find lib -name "*.dart" -type f -exec sed -i 's/withOpacity(/withValues(alpha: /g' {} \;

echo "Fixed withOpacity() calls."
echo ""
echo "Removing flutter_animate unused imports..."

# Remove unused flutter_animate imports
find lib -name "*.dart" -type f -exec sed -i "/import 'package:flutter_animate\/flutter_animate.dart';/d" {} \;

echo "Removed unused imports."
