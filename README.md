# pi-animations

Animated thinking, working, and tool-execution indicators for [pi coding agent](https://github.com/badlogic/pi-mono).

Replace pi's default spinner with 21 terminal animations — from demoscene fire to Matrix rain to Pac-Man — all rendered inline with ANSI true color and Nerd Font glyphs.

## Demo

https://github.com/user-attachments/assets/demo.mp4

<video src="assets/demo.mp4" width="100%" autoplay loop muted></video>

## Install

### From npm (recommended)

```bash
pi install pi-animations
```

### From GitHub

```bash
pi install github.com/arpagon/pi-animations
```

### Manual

```bash
git clone https://github.com/arpagon/pi-animations.git
pi -e ./pi-animations/animations.ts
```

Or add to `~/.pi/agent/agent.json`:

```json
{
  "extensions": [
    "npm:pi-animations"
  ]
}
```

## Usage

Everything is under the `/animation` command:

```
/animation                          Show status, list all animations, and help
/animation showcase                 Interactive browser (←/→ to navigate, Enter to select)
/animation <name>                   Set animation for all states
/animation working:<name>           Set working animation only
/animation thinking:<name>          Set thinking animation only
/animation tool:<name>              Set tool execution animation only
/animation width full               Full terminal width (default)
/animation width default            50 columns
/animation width <number>           Custom column count
/animation random                   Random animation each time
/animation on                       Enable animations
/animation off                      Disable animations
```

### Example config

```
/animation thinking:aurora
/animation working:matrix3
/animation tool:fire3
/animation width full
```

## Animations

### 1-line

| Name | Category | Description |
|------|----------|-------------|
| `neural-pulse` | thinking | Energy pulses along neural pathway |
| `glitch-text` | both | Cyberpunk glitch effect |
| `plasma-wave` | thinking | Colorful plasma band |
| `pacman` | working | Pac-Man eating dots |
| `matrix` | both | Matrix rain |
| `pipeline` | working | CI/CD pipeline with nerd font icons |
| `starfield` | thinking | Horizontal parallax stars |
| `fire` | working | Demoscene fire |
| `icon-morph` | both | Morphing nerd font icons |
| `brainstorm` | thinking | Weather icon brainstorm |
| `dev-constellation` | thinking | Dev language icons with pulses |
| `crush` | both | Crush-style character scrambler |
| `pi-pulse` | both | Pi logo with gradient pulse |
| `shimmer` | thinking | Rainbow shimmer text |
| `typewriter` | both | Themed typewriter messages |
| `orbit-dots` | thinking | Pulsing orbit dots |
| `neon-bounce` | working | Neon ball bouncing between walls |

### 3-line

| Name | Category | Description |
|------|----------|-------------|
| `fire3` | working | 🔥 Demoscene fire |
| `matrix3` | both | 🟢 Matrix rain |
| `starfield3` | thinking | ✦ Deep starfield |
| `aurora` | thinking | 🌌 Aurora borealis |

### Categories

- **thinking** — shown while the model is reasoning (extended thinking phase)
- **working** — shown while the model generates a response
- **tool** — shown while tools execute (file reads, bash commands, etc.)
- **both** — suitable for any state

## How it works

### Three animation states

pi has three distinct phases during a request:

1. **Thinking** — The model reasons internally (e.g., Claude's extended thinking, OpenAI's chain-of-thought). The extension detects `thinking_start`/`thinking_end` stream events.

2. **Working** — The model generates visible text output. Detected via `agent_start`/`agent_end` events.

3. **Tool** — A tool is executing (bash, file read/write, etc.). Detected via `tool_execution_start`/`tool_execution_end` events.

Priority: **thinking > tool > working**. If the model is thinking while a tool runs, the thinking animation takes precedence.

### Rendering

- **1-line animations** use `ctx.ui.setWorkingMessage()` to replace the Loader's text inline alongside pi's braille spinner.
- **3-line animations** use `ctx.ui.setWidget()` to render a multi-line widget.
- **Thinking label** patches `AssistantMessageComponent.updateContent()` to animate the collapsed "Thinking..." text in the message body.

### Phase-aware text

Animations that display text (glitch-text, crush, shimmer, orbit-dots) automatically adapt their label:

- Thinking state → "Thinking..."
- Working state → "Working..."
- Tool state → "Running..."

### Full-width rendering

Visual animations (fire, plasma, matrix, starfield, aurora, neon-bounce) scale to fill the terminal width. Structural animations (pacman, pipeline, neural-pulse) keep a fixed size.

Configurable via `/animation width`.

### Persistence

All settings are saved to `~/.pi/agent/extensions/pi-tui-animations.json` and restored on startup:

```json
{
  "workingAnim": "matrix3",
  "thinkingAnim": "aurora",
  "toolAnim": "fire3",
  "width": "full",
  "randomMode": false,
  "enabled": true
}
```

## Requirements

- [pi coding agent](https://github.com/badlogic/pi-mono) v0.60+
- Terminal with true color (24-bit ANSI) support
- [Nerd Font](https://www.nerdfonts.com/) (for icon-based animations: pipeline, dev-constellation, icon-morph, pi-pulse, brainstorm)

## Development

### Standalone animation demos

Each animation has a standalone demo in `explorations/`:

```bash
bun run explorations/12-fire.ts
bun run explorations/20-crush-scramble.ts
```

Run all demos in tmux:

```bash
bash tmux-demo.sh
tmux attach -t pi-anims
# Ctrl-b n/p to navigate between windows
```

### Project structure

```
pi-animations/
├── animations.ts         Extension: 21 animations + /animation command
├── package.json
├── explorations/         Standalone animation demos (bun run)
├── tmux-demo.sh          Launch all demos in tmux
├── AGENTS.md             Agent context
└── README.md
```

### Adding a new animation

1. Add a renderer function in `animations.ts`:

```typescript
export const myAnimation: AnimationFn = (frame, width, phase?) => {
    const label = PHASE_LABELS[phase || "thinking"];
    // ... render logic using frame counter and width
    return "single line result";    // or ["line1", "line2", "line3"] for 3-line
};
```

2. Register it in the `ANIMATIONS` array:

```typescript
{ name: "my-anim", fn: myAnimation, category: "both", description: "My animation", lines: 1 },
```

3. Done — it appears in `/animation showcase` and `/animation my-anim`.

## License

MIT
