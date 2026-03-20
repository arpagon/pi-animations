# pi-animations

Animated thinking/working/tool indicators for pi coding agent.

## Structure

- `animations.ts` — single-file extension: 21 animations + `/animation` command + AssistantMessageComponent patch
- `explorations/` — standalone demos (`bun run explorations/XX-name.ts`)
- `tmux-demo.sh` — launch all demos in tmux

## Quick start

```bash
pi -e ./animations.ts
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
