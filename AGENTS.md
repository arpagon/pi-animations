# pi-tui-animations

Animated thinking/working indicators for pi coding agent.

## Goal

Replace pi's default "Working..." spinner and "Thinking..." label with visually rich
terminal animations using ANSI true color, Unicode, and Nerd Font glyphs.

## Structure

- `explorations/` — standalone animation demos (run with `bun run explorations/XX-name.ts`)
- `extension/` — pi extension (the actual product)
  - `index.ts` — extension entry point (events, commands, monkey-patch)
  - `animations.ts` — all animation renderers as pure functions
- `tmux-demo.sh` — launch all demos in tmux

## Running demos

```bash
bash tmux-demo.sh
tmux attach -t pi-anims
# Ctrl-b n/p to navigate
```

## Using the extension

```bash
pi -e ./extension/index.ts

# Commands inside pi:
/animation              # show current + list all
/animation crush        # set both working + thinking
/animation working:fire # set only working
/animation thinking:shimmer # set only thinking
/animation random       # random each time
/animation off          # disable
```

## Animation Categories

- **Thinking** (7): neural-pulse, plasma-wave, starfield, brainstorm, dev-constellation, shimmer, orbit-dots
- **Working** (4): pacman, pipeline, fire, neon-bounce
- **Both** (6): glitch-text, matrix, icon-morph, crush, pi-pulse, typewriter

## Requirements

- Terminal with true color (24-bit) support
- Nerd Font (for icon-based animations)
- pi coding agent v0.60+
