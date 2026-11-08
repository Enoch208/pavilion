#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
TARGET=${PAVILION_SSH:-root@76.13.10.76}
KEY=${PAVILION_SSH_KEY:-$HOME/.ssh/orvane_deploy}
DOMAIN=${PAVILION_HOST:-pavilion.76-13-10-76.sslip.io}
OPTS=(-i "$KEY" -o IdentitiesOnly=yes -o ConnectTimeout=15)
AGENT_KEYS='^(OPENAI_API_KEY|AGENT_ENGINE|AGENT_ENGINE_PREFER_BYO_KEY)='
run() { ssh "${OPTS[@]}" "$TARGET" "$@"; }
put() { scp -q "${OPTS[@]}" "$1" "$TARGET:$2"; }

[ -f .env ] || { echo "Missing .env with OPENAI_API_KEY"; exit 1; }

echo "1/6 pavilion user and directories"
run 'id pavilion >/dev/null 2>&1 || useradd --system --home-dir /srv/pavilion --shell /usr/sbin/nologin pavilion
     mkdir -p /srv/pavilion/releases /etc/pavilion && chown -R pavilion:pavilion /srv/pavilion && chmod 700 /etc/pavilion'

echo "2/6 Postgres container pavilion-postgres on 127.0.0.1:54370"
put deploy/vps/docker-compose.postgres.yml /srv/pavilion/docker-compose.postgres.yml
run 'umask 077
     [ -f /etc/pavilion/postgres.env ] || printf "PAVILION_PG_PASSWORD=%s\n" "$(openssl rand -hex 24)" > /etc/pavilion/postgres.env
     docker compose -p pavilion -f /srv/pavilion/docker-compose.postgres.yml --env-file /etc/pavilion/postgres.env up -d
     for i in $(seq 1 30); do docker exec pavilion-postgres pg_isready -U pavilion -d pavilion >/dev/null 2>&1 && break; sleep 1; done
     docker exec pavilion-postgres pg_isready -U pavilion -d pavilion'

echo "3/6 app environment /etc/pavilion/pavilion.env, secrets generated on the server"
grep -E "$AGENT_KEYS" .env | run 'umask 077; cat > /etc/pavilion/agent.env'
run "umask 077
     if [ ! -f /etc/pavilion/pavilion.env ]; then
       . /etc/pavilion/postgres.env
       URL=postgres://pavilion:\$PAVILION_PG_PASSWORD@127.0.0.1:54370/pavilion
       { echo NODE_ENV=production; echo HOST=127.0.0.1; echo PORT=3320
         echo DATABASE_URL=\$URL; echo DATABASE_URL_UNPOOLED=\$URL
         echo BETTER_AUTH_SECRET=\$(openssl rand -base64 32)
         echo BETTER_AUTH_URL=https://$DOMAIN; echo APP_URL=https://$DOMAIN
         echo AGENT_NATIVE_RELEASE_MIGRATIONS=1
       } > /etc/pavilion/pavilion.env
     fi
     grep -vE '$AGENT_KEYS' /etc/pavilion/pavilion.env > /etc/pavilion/pavilion.env.new
     cat /etc/pavilion/agent.env >> /etc/pavilion/pavilion.env.new && mv /etc/pavilion/pavilion.env.new /etc/pavilion/pavilion.env
     rm -f /etc/pavilion/agent.env && chmod 600 /etc/pavilion/pavilion.env
     sed 's/=.*/=<set>/' /etc/pavilion/pavilion.env"

echo "4/6 systemd unit, enabled; it starts on the first deploy"
put deploy/vps/pavilion.service /etc/systemd/system/pavilion.service
run 'systemctl daemon-reload && systemctl enable pavilion >/dev/null 2>&1 && echo enabled'

echo "5/6 nginx site for $DOMAIN and a Let's Encrypt certificate"
CONF=$(mktemp)
sed "s/PAVILION_HOST/$DOMAIN/" deploy/vps/nginx-pavilion.conf > "$CONF"
put "$CONF" /etc/nginx/sites-available/pavilion && rm "$CONF"
run "ln -sfn /etc/nginx/sites-available/pavilion /etc/nginx/sites-enabled/pavilion && nginx -t && systemctl reload nginx
     certbot --nginx -d $DOMAIN --cert-name pavilion --non-interactive --agree-tos --redirect"

echo "6/6 first deploy"
deploy/vps/deploy.sh
curl -fsS -o /dev/null -w "https://$DOMAIN → %{http_code}\n" "https://$DOMAIN/"
