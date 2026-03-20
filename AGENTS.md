# pi-animations

Animated thinking/working/tool indicators for pi coding agent.

## Structure

- `extension/` — pi extension (the product)
  - `index.ts` — entry point: events, `/animation` command, AssistantMessageComponent patch
  - `animations.ts` — 21 animation renderers as pure functions
- `explorations/` — standalone demos (`bun run explorations/XX-name.ts`)
- `tmux-demo.sh` — launch all demos in tmux

## Quick start

```bash
pi -e ./extension/index.ts
/animation showcase    # browse all
/animation fire3       # set all states
```

## Architecture

- **1-line**: `setWorkingMessage()` on pi's Loader
- **3-line**: `setWidget("anim-multi", lines)` for multi-line
- **Thinking label**: monkey-patch `AssistantMessageComponent.updateContent()`
- **State priority**: thinking > tool > working
- **Config**: `~/.pi/agent/extensions/pi-tui-animations.json`
- **AnimationFn**: `(frame, width, phase?) => string | string[]`
