#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
TARGET=${PAVILION_SSH:-root@76.13.10.76}
KEY=${PAVILION_SSH_KEY:-$HOME/.ssh/orvane_deploy}
OPTS=(-i "$KEY" -o IdentitiesOnly=yes -o ConnectTimeout=15)
REL=$(date +%Y%m%d%H%M%S)
TUNNEL="54371:127.0.0.1:54370"

echo "→ build"
pnpm build >/dev/null

echo "→ bundle runtime externals"
for p in react react-dom scheduler; do
  dir=$(node -e "const path=require('path');const base=path.dirname(require.resolve('react-dom/package.json'));console.log(path.dirname(require.resolve('$p/package.json',{paths:[process.cwd(),base]})))")
  rm -rf ".output/server/node_modules/$p" && cp -RL "$dir" ".output/server/node_modules/$p"
done

echo "→ upload release $REL"
ssh "${OPTS[@]}" "$TARGET" "mkdir -p /srv/pavilion/releases/$REL"
rsync -az --delete -e "ssh ${OPTS[*]}" .output/ "$TARGET:/srv/pavilion/releases/$REL/.output/"

echo "→ migrate through a tunnel to the host's Postgres"
REMOTE_URL=$(ssh "${OPTS[@]}" "$TARGET" "grep '^DATABASE_URL_UNPOOLED=' /etc/pavilion/pavilion.env | cut -d= -f2-")
ssh "${OPTS[@]}" -f -N -o ExitOnForwardFailure=yes -L "$TUNNEL" "$TARGET"
trap 'pkill -f "$TUNNEL" || true' EXIT
DATABASE_URL="${REMOTE_URL/127.0.0.1:54370/127.0.0.1:54371}" pnpm migrate:production

echo "→ switch and restart"
ssh "${OPTS[@]}" "$TARGET" "chown -R pavilion:pavilion /srv/pavilion/releases/$REL && ln -sfn /srv/pavilion/releases/$REL /srv/pavilion/current && systemctl restart pavilion \
  && for i in \$(seq 1 30); do curl -fsS -o /dev/null http://127.0.0.1:3320/ && break; sleep 1; done \
  && curl -fsS -o /dev/null -w 'local %{http_code}\n' http://127.0.0.1:3320/ \
  && ls -1dt /srv/pavilion/releases/* | tail -n +4 | xargs -r rm -rf"
echo "✓ deployed $REL"
