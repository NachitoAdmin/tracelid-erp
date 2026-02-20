#!/bin/bash
# Deploy enhanced Tracelid ERP

cd /Users/nachitobot/.openclaw/workspace/erp-nextjs

echo "🚀 Deploying Enhanced Tracelid ERP..."

# Deploy to Vercel
vercel --prod --token ***REMOVED*** --yes

echo "✅ Deployment complete!"
