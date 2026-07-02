#!/bin/bash

# Exit on error
set -e

echo "=== Starting Flutter Web Build on Vercel ==="

# 1. Clone the Flutter SDK (stable channel)
if [ ! -d "flutter" ]; then
  echo "Cloning Flutter SDK..."
  git clone https://github.com/flutter/flutter.git -b stable --depth 1
else
  echo "Flutter SDK already exists, skipping clone."
fi

# 2. Add Flutter to the path
export PATH="$PATH:$(pwd)/flutter/bin"

# 3. Disable analytics and verify installation
flutter config --no-analytics
flutter doctor

# 4. Enable web build support (just in case)
flutter config --enable-web

# 5. Get packages
flutter pub get

# 6. Build the web app
echo "Building Flutter Web release..."
flutter build web --release --base-href "/"

echo "=== Build Complete! ==="
