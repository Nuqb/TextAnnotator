#!/bin/bash

# Build script for Render deployment
# This script injects environment variables into the client-side code

echo "🚀 Starting build process for musicContext..."

# Create a temporary config file with environment variables
cat > js/config/env.js << EOF
// Environment variables injected at build time
window.SUPABASE_URL = '${SUPABASE_URL}';
window.SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';
EOF

# Inject the env script into index.html if not already present
if ! grep -q "js/config/env.js" index.html; then
    # Add the env script before the closing </head> tag
    sed -i 's|</head>|    <script src="js/config/env.js"></script>\n</head>|' index.html
fi

echo "✅ Build completed successfully!"
echo "📦 Environment variables injected"
echo "🌐 Ready for deployment to Render" 