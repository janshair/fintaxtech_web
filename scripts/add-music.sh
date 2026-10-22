#!/bin/sh
# Encrypts Reel music so it can be committed to this public repository.
#
# Usage: scripts/add-music.sh <id> <audio file> [<id> <audio file> ...]
#   e.g. scripts/add-music.sh glow ~/Downloads/Glow.mp4
#
# The encryption key lives in your macOS Keychain ("fintaxtech-music-key"). The first run
# creates it and copies it to your clipboard so you can save it as the MUSIC_KEY GitHub secret.
# The key is never printed. Each <id> must also be listed in social/music/tracks.json.
set -eu
cd "$(dirname "$0")/.."
[ $# -ge 2 ] && [ $(($# % 2)) -eq 0 ] || { echo "Usage: scripts/add-music.sh <id> <audio file> [...]" >&2; exit 1; }

if ! KEY=$(security find-generic-password -a fintaxtech -s fintaxtech-music-key -w 2>/dev/null); then
  KEY=$(openssl rand -base64 32)
  security add-generic-password -a fintaxtech -s fintaxtech-music-key -w "$KEY"
  printf '%s' "$KEY" | pbcopy
  echo "Created a new music key in your Keychain and copied it to the clipboard."
  echo "Add it now in GitHub: Settings > Secrets and variables > Actions > New secret, name MUSIC_KEY."
fi
export KEY

while [ $# -gt 0 ]; do
  id=$1 file=$2
  shift 2
  grep -q "\"id\": \"$id\"" social/music/tracks.json || { echo "Add \"$id\" to social/music/tracks.json first." >&2; exit 1; }
  openssl enc -aes-256-cbc -md sha256 -pbkdf2 -iter 200000 -salt -in "$file" -out "social/music/$id.mp4.enc" -pass env:KEY
  echo "Encrypted $file -> social/music/$id.mp4.enc"
done
