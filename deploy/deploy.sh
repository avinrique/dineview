#!/usr/bin/env bash
# Builds DineView on this machine (a 1 GB instance can't run `next build`),
# ships it to the server, then installs, migrates and restarts there.
#
# Usage: deploy/deploy.sh          update the running site
#        deploy/deploy.sh --seed   also load the demo restaurant (first deploy)
#
# DEPLOY_HOST, DEPLOY_KEY and DEPLOY_DOMAIN override the defaults below.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-ec2-user@16.171.173.4}"
KEY="${DEPLOY_KEY:-$HOME/Downloads/dineview.pem}"
DOMAIN="${DEPLOY_DOMAIN:-16-171-173-4.sslip.io}"
SEED="${1:-}"
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"

pnpm --filter @dineview/shared build
pnpm --filter @dineview/api build
(cd apps/web && pnpm exec next build)

$SSH "$HOST" 'bash -s' -- "$DOMAIN" <deploy/setup-server.sh

rsync -az --delete -e "$SSH" \
  --exclude node_modules --exclude .git --exclude .turbo --exclude .DS_Store \
  --exclude 'apps/web/.next/cache' --exclude '*.tsbuildinfo' \
  --exclude .env --exclude .env.local --exclude certs --exclude 'apps/api/uploads' \
  ./ "$HOST:dineview/"

$SSH "$HOST" 'bash -s' -- "$SEED" <<'EOF'
set -euo pipefail
export PATH=/opt/node/bin:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0
cd ~/dineview
pnpm install --frozen-lockfile --reporter=append-only | tail -5
cd apps/api
set -a; . ~/dineview-data/api.env; set +a
pnpm exec prisma migrate deploy
# ssh drops an empty argument, so $1 may be unset
if [ "${1:-}" = "--seed" ]; then
  pnpm exec prisma db seed
  pnpm run demo:reset
fi
sudo systemctl restart dineview-api dineview-web
EOF

echo "Deployed: https://$DOMAIN"
