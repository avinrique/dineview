#!/usr/bin/env bash
# Provisions an Amazon Linux 2023 host for DineView: swap, Node 22, Postgres 16,
# Redis, Caddy (automatic HTTPS) and the systemd units. Safe to re-run;
# deploy.sh runs it before every deploy.
#
# Usage: ssh ec2-user@HOST 'bash -s' -- <domain> < deploy/setup-server.sh
set -euo pipefail

DOMAIN="${1:?usage: setup-server.sh <domain>}"
APP=/home/ec2-user/dineview
DATA=/home/ec2-user/dineview-data

case "$(uname -m)" in
  x86_64) NODE_ARCH=x64 GO_ARCH=amd64 ;;
  aarch64) NODE_ARCH=arm64 GO_ARCH=arm64 ;;
  *) echo "unsupported arch $(uname -m)" >&2; exit 1 ;;
esac

# A 1 GB instance needs swap for `pnpm install` next to two Node servers
if ! sudo swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap defaults 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# Guests in India are ~200 ms from eu-north-1, where the default cubic crawls
# (~0.2 MB/s) on big downloads like the 3D models; BBR handles that distance
if [ "$(sysctl -n net.ipv4.tcp_congestion_control)" != bbr ]; then
  echo tcp_bbr | sudo tee /etc/modules-load.d/bbr.conf >/dev/null
  printf 'net.core.default_qdisc = fq\nnet.ipv4.tcp_congestion_control = bbr\n' | sudo tee /etc/sysctl.d/90-bbr.conf >/dev/null
  sudo modprobe tcp_bbr
  sudo sysctl -q -p /etc/sysctl.d/90-bbr.conf
fi

sudo dnf install -y -q postgresql16-server redis6 rsync tar xz >/dev/null

# Node 22 LTS from nodejs.org (the distro packages lag behind)
if ! /opt/node/bin/node -v 2>/dev/null | grep -q '^v22\.'; then
  base=https://nodejs.org/dist/latest-v22.x
  sums=$(curl -fsSL "$base/SHASUMS256.txt")
  file=$(awk -v f="linux-$NODE_ARCH.tar.xz" '$2 ~ f"$" {print $2}' <<<"$sums")
  curl -fsSLo "/tmp/$file" "$base/$file"
  (cd /tmp && grep " $file\$" <<<"$sums" | sha256sum -c --quiet -)
  sudo rm -rf /opt/node && sudo mkdir -p /opt/node
  sudo tar -xJf "/tmp/$file" -C /opt/node --strip-components=1
  rm "/tmp/$file"
fi
# pnpm comes from corepack, pinned by packageManager in package.json
sudo env PATH="/opt/node/bin:$PATH" corepack enable --install-directory /opt/node/bin
sudo ln -sf /opt/node/bin/{node,npm,npx,pnpm,corepack} /usr/local/bin/

# Postgres: password auth on localhost, sized for a small instance
if ! sudo test -f /var/lib/pgsql/data/PG_VERSION; then
  sudo postgresql-setup --initdb >/dev/null
  sudo sed -i -E 's/^(host\s+all\s+all\s+(127\.0\.0\.1\/32|::1\/128)\s+)ident/\1scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf
  printf 'shared_buffers = 64MB\nmax_connections = 30\n' | sudo tee -a /var/lib/pgsql/data/postgresql.conf >/dev/null
fi
sudo systemctl enable --now postgresql redis6 >/dev/null 2>&1

# Database role and API environment, created once with fresh secrets
mkdir -p "$DATA/uploads"
if [ ! -f "$DATA/api.env" ]; then
  pw=$(openssl rand -hex 24)
  (cd / && sudo -u postgres psql -q -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE dineview LOGIN PASSWORD '$pw'" \
    -c "CREATE DATABASE dineview OWNER dineview")
  install -m 600 /dev/null "$DATA/api.env"
  cat >"$DATA/api.env" <<EOF
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://dineview:$pw@127.0.0.1:5432/dineview?schema=public
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_SESSION_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=https://$DOMAIN
WEB_URL=https://$DOMAIN
DEMO_RESTAURANT_SLUG=bella-vista
UPLOAD_DIR=$DATA/uploads
EOF
fi

# Caddy: reverse proxy with automatic Let's Encrypt certificates
if ! command -v caddy >/dev/null; then
  ver=$(curl -fsSL https://api.github.com/repos/caddyserver/caddy/releases/latest | sed -nE 's/.*"tag_name": *"v([^"]+)".*/\1/p')
  tgz="caddy_${ver}_linux_${GO_ARCH}.tar.gz"
  url="https://github.com/caddyserver/caddy/releases/download/v$ver"
  curl -fsSLo "/tmp/$tgz" "$url/$tgz"
  (cd /tmp && curl -fsSL "$url/caddy_${ver}_checksums.txt" | grep " $tgz\$" | sha512sum -c --quiet -)
  sudo tar -xzf "/tmp/$tgz" -C /usr/local/bin caddy
  rm "/tmp/$tgz"
fi
id caddy >/dev/null 2>&1 || sudo useradd --system --home-dir /var/lib/caddy --create-home --shell /sbin/nologin caddy
sudo mkdir -p /etc/caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}

# Bare IP and any other host name: send visitors to the HTTPS domain
http:// {
	redir https://$DOMAIN{uri}
}
EOF

sudo tee /etc/systemd/system/caddy.service >/dev/null <<'EOF'
[Unit]
Description=Caddy
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/dineview-api.service >/dev/null <<EOF
[Unit]
Description=DineView API
After=network.target postgresql.service redis6.service
Wants=postgresql.service redis6.service

[Service]
User=ec2-user
WorkingDirectory=$APP/apps/api
EnvironmentFile=$DATA/api.env
Environment=NODE_OPTIONS=--max-old-space-size=256
ExecStart=/opt/node/bin/node dist/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/dineview-web.service >/dev/null <<EOF
[Unit]
Description=DineView web
After=network.target dineview-api.service

[Service]
User=ec2-user
WorkingDirectory=$APP/apps/web
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=384
ExecStart=/opt/node/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable caddy dineview-api dineview-web >/dev/null 2>&1
if sudo systemctl is-active -q caddy; then sudo systemctl reload caddy; else sudo systemctl start caddy; fi
