#!/bin/bash
# Launch all animations in tmux — one window per animation
# Navigate: Ctrl-b n (next), Ctrl-b p (prev), Ctrl-b w (window list)
SESSION="pi-anims"
DIR="$(cd "$(dirname "$0")" && pwd)/explorations"
tmux kill-session -t "$SESSION" 2>/dev/null
first=true
for f in "$DIR"/*.ts; do
  name=$(basename "$f" .ts)
  if $first; then
    tmux new-session -d -s "$SESSION" -n "$name" "bun run $f"
    first=false
  else
    tmux new-window -t "$SESSION" -n "$name" "bun run $f"
  fi
done
echo "Session '$SESSION' ready — tmux attach -t $SESSION"
echo "Navigate: Ctrl-b n/p (next/prev), Ctrl-b w (list)"
