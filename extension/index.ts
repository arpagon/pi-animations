/**
 * pi-animated-thinking — Animated thinking/working indicators for pi
 *
 * Usage:
 *   pi -e ./extension/index.ts
 *
 * Commands:
 *   /animation              — Show current animation + list all
 *   /animation <name>       — Set animation (e.g. /animation plasma-wave)
 *   /animation random       — Random animation each time
 *   /animation off          — Disable (restore defaults)
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { AssistantMessageComponent, getAgentDir } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANIMATIONS, getAnimation, getAnimationsForCategory, type AnimationFn, type AnimCategory, type AnimPhase } from "./animations.js";

const PATCH_KEY = Symbol.for("pi.ext.animatedThinking.patch");
const STATE_KEY = Symbol.for("pi.ext.animatedThinking.state");
const CONFIG_NAME = "pi-tui-animations.json";

// ─── Config persistence ─────────────────────────────────────────
interface AnimConfig {
	workingAnim?: string;
	thinkingAnim?: string;
	toolAnim?: string;
	width?: "full" | "default" | number;
	randomMode?: boolean;
	enabled?: boolean;
}

function getConfigPath(): string {
	return join(getAgentDir(), "extensions", CONFIG_NAME);
}

function loadConfig(): AnimConfig {
	const path = getConfigPath();
	if (!existsSync(path)) return {};
	try {
		return JSON.parse(readFileSync(path, "utf-8")) as AnimConfig;
	} catch {
		return {};
	}
}

function saveConfig(config: AnimConfig): void {
	const dir = join(getAgentDir(), "extensions");
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + "\n");
}

function resolveWidth(w: "full" | "default" | number | undefined): number {
	if (w === "full" || w === undefined) return (process.stdout.columns || 80) - 4;
	if (w === "default") return 50;
	return Math.max(10, Math.min(w, (process.stdout.columns || 80) - 4));
}

interface AnimState {
	workingAnim: string;
	thinkingAnim: string;
	toolAnim: string;
	width: "full" | "default" | number;
	randomMode: boolean;
	frame: number;
	workingTimer: ReturnType<typeof setInterval> | null;
	thinkingTimer: ReturnType<typeof setInterval> | null;
	thinkingLabels: Map<string, Text>;
	theme?: ExtensionContext["ui"]["theme"];
	enabled: boolean;
	isThinking: boolean;
	isToolRunning: boolean;
	currentWorkingCtx: ExtensionContext | null;
}

function getState(): AnimState {
	return (globalThis as any)[STATE_KEY];
}

function renderFrame(animName: string, frame: number, width: number, phase?: AnimPhase): string[] {
	const anim = getAnimation(animName);
	if (!anim) return ["Working..."];
	const result = anim.fn(frame, width, phase);
	return Array.isArray(result) ? result : [result];
}

function pickRandom(cat: AnimCategory): string {
	const anims = getAnimationsForCategory(cat);
	return anims[Math.floor(Math.random() * anims.length)].name;
}

// ─── Thinking patch (monkey-patch AssistantMessageComponent) ─────
function ensurePatch(): void {
	const proto: any = AssistantMessageComponent.prototype as any;
	if (proto[PATCH_KEY]) return;
	proto[PATCH_KEY] = true;

	const original = proto.updateContent;
	proto.updateContent = function patchedUpdateContent(this: any, message: any) {
		original.call(this, message);
		try {
			const state = getState();
			if (!state?.enabled) return;
			if (!message?.content || !Array.isArray(message.content)) return;
			if (!this.hideThinkingBlock) return;
			if (!this.contentContainer?.children) return;

			// Find Text components with "Thinking..."
			for (const child of this.contentContainer.children as any[]) {
				if (!child || typeof child.setText !== "function") continue;
				if (typeof child.text !== "string" || !child.text.includes("Thinking")) continue;

				const key = `${message.timestamp}`;
				state.thinkingLabels.set(key, child as Text);

				// Render animated frame
				const animName = state.randomMode ? pickRandom("thinking") : state.thinkingAnim;
				child.setText(renderFrame(animName, state.frame, 60));
			}
		} catch { /* never break rendering */ }
	};
}

export default function (pi: ExtensionAPI) {
	const cfg = loadConfig();
	const state: AnimState = {
		workingAnim: cfg.workingAnim || "crush",
		thinkingAnim: cfg.thinkingAnim || "shimmer",
		toolAnim: cfg.toolAnim || "pipeline",
		width: cfg.width ?? "full",
		randomMode: cfg.randomMode ?? false,
		enabled: cfg.enabled ?? true,
		frame: 0,
		workingTimer: null,
		thinkingTimer: null,
		thinkingLabels: new Map(),
		theme: undefined,
		isThinking: false,
		isToolRunning: false,
		currentWorkingCtx: null,
	};
	(globalThis as any)[STATE_KEY] = state;
	ensurePatch();

	function persistConfig() {
		saveConfig({
			workingAnim: state.workingAnim,
			thinkingAnim: state.thinkingAnim,
			toolAnim: state.toolAnim,
			width: state.width,
			randomMode: state.randomMode,
			enabled: state.enabled,
		});
	}

	// ─── Working animation ───────────────────────────────────────
	let lastAnimLines = 0; // track if we need to switch between message/widget

	function startWorkingAnimation(ctx: ExtensionContext) {
		stopWorkingAnimation(ctx);
		if (!state.enabled) return;
		state.frame = 0;
		state.currentWorkingCtx = ctx;
		lastAnimLines = 0;
		const randomWorkingName = state.randomMode ? pickRandom("working") : null;
		const randomThinkingName = state.randomMode ? pickRandom("thinking") : null;
		const randomToolName = state.randomMode ? pickRandom("working") : null;
		state.workingTimer = setInterval(() => {
			state.frame++;
			// Priority: thinking > tool > working
			let animName: string;
			let phase: AnimPhase;
			if (state.isThinking) {
				animName = randomThinkingName || state.thinkingAnim;
				phase = "thinking";
			} else if (state.isToolRunning) {
				animName = randomToolName || state.toolAnim;
				phase = "tool";
			} else {
				animName = randomWorkingName || state.workingAnim;
				phase = "working";
			}
			const w = resolveWidth(state.width);
			const lines = renderFrame(animName, state.frame, w, phase);
			if (lines.length === 1) {
				// Single line: use setWorkingMessage (replaces Loader text)
				if (lastAnimLines > 1) ctx.ui.setWidget("anim-multi", undefined);
				ctx.ui.setWorkingMessage(lines[0]);
				lastAnimLines = 1;
			} else {
				// Multi-line: use setWidget
				if (lastAnimLines <= 1) ctx.ui.setWorkingMessage(undefined);
				ctx.ui.setWidget("anim-multi", lines);
				lastAnimLines = lines.length;
			}
		}, 60);
	}

	function stopWorkingAnimation(ctx?: ExtensionContext) {
		if (state.workingTimer) {
			clearInterval(state.workingTimer);
			state.workingTimer = null;
		}
		if (lastAnimLines > 1 && ctx) {
			ctx.ui.setWidget("anim-multi", undefined);
		}
		lastAnimLines = 0;
		state.currentWorkingCtx = null;
	}

	// ─── Thinking animation tick ─────────────────────────────────
	function startThinkingTicker() {
		if (state.thinkingTimer) return;
		state.thinkingTimer = setInterval(() => {
			state.frame++;
			const animName = state.randomMode ? pickRandom("thinking") : state.thinkingAnim;
			const lines = renderFrame(animName, state.frame, 60, "thinking");
			for (const [, label] of state.thinkingLabels) {
				// Thinking labels are always single-line Text components
				label.setText(lines[0]);
			}
		}, 60);
	}

	function stopThinkingTicker() {
		if (state.thinkingTimer) {
			clearInterval(state.thinkingTimer);
			state.thinkingTimer = null;
		}
		state.thinkingLabels.clear();
	}

	// ─── Events ──────────────────────────────────────────────────
	pi.on("session_start", async (_e, ctx) => {
		state.theme = ctx.ui.theme;
	});

	pi.on("agent_start", async (_e, ctx) => {
		startWorkingAnimation(ctx);
	});

	pi.on("agent_end", async (_e, ctx) => {
		state.isThinking = false;
		state.isToolRunning = false;
		stopWorkingAnimation(ctx);
		stopThinkingTicker();
		ctx.ui.setWorkingMessage(); // restore default
	});

	pi.on("message_update", async (event, ctx) => {
		state.theme = ctx.ui.theme;
		const se = event.assistantMessageEvent as any;
		if (!se || typeof se.type !== "string") return;
		if (se.type === "thinking_start" || se.type === "thinking_delta") {
			state.isThinking = true;
			if (state.enabled) startThinkingTicker();
		}
		if (se.type === "thinking_end") {
			state.isThinking = false;
			// Keep label with final frame
		}
		if (se.type === "text_delta") {
			// Content started flowing, no longer thinking
			state.isThinking = false;
		}
	});

	pi.on("message_end", async () => {
		state.isThinking = false;
		stopThinkingTicker();
	});

	pi.on("tool_execution_start", async () => {
		state.isToolRunning = true;
	});

	pi.on("tool_execution_end", async () => {
		state.isToolRunning = false;
	});

	pi.on("session_switch", async (_e, ctx) => {
		stopWorkingAnimation(ctx);
		stopThinkingTicker();
		ctx.ui.setWorkingMessage();
	});

	pi.on("session_shutdown", async () => {
		stopWorkingAnimation();
		stopThinkingTicker();
	});

	// ─── Showcase (used by /animation showcase) ─────────────────
	async function runShowcase(ctx: ExtensionContext) {
		await ctx.ui.custom((tui, theme, _keybindings, done) => {
			let idx = 0;
			let frame = 0;

			const timer = setInterval(() => {
				frame++;
				tui.requestRender();
			}, 50);

			return {
				invalidate() {},
				dispose() { clearInterval(timer); },
				handleInput(data: string) {
					if (data === "\x1b" || data === "q") {
						clearInterval(timer);
						done(null);
					} else if (data === "\x1b[C" || data === "l" || data === "n") {
						idx = (idx + 1) % ANIMATIONS.length;
						frame = 0;
					} else if (data === "\x1b[D" || data === "h" || data === "p") {
						idx = (idx - 1 + ANIMATIONS.length) % ANIMATIONS.length;
						frame = 0;
					} else if (data === "\r" || data === " ") {
						clearInterval(timer);
						done(ANIMATIONS[idx].name);
					}
				},
				render(width: number): string[] {
					const anim = ANIMATIONS[idx];
					const w = resolveWidth(state.width);
					const raw = anim.fn(frame, Math.min(w, width - 4));
					const rendered = Array.isArray(raw) ? raw : [raw];
					const out: string[] = [];
					out.push("");
					out.push(theme.fg("accent", "  ▶ Animation Showcase"));
					out.push("");
					for (const line of rendered) out.push(`  ${line}`);
					out.push("");
					out.push(
						theme.fg("muted", `  [${idx + 1}/${ANIMATIONS.length}] `) +
						theme.fg("text", anim.name) +
						theme.fg("muted", ` (${anim.category}, ${anim.lines}L) — ${anim.description}`)
					);
					out.push("");
					out.push(theme.fg("dim", "  ←/→ switch  •  Enter/Space select  •  Esc quit"));
					out.push("");
					return out;
				},
			};
		}).then((selectedName) => {
			if (selectedName) {
				state.enabled = true;
				state.randomMode = false;
				state.workingAnim = selectedName;
				state.thinkingAnim = selectedName;
				state.toolAnim = selectedName;
				persistConfig();
				ctx.ui.notify(`Animation set to: ${selectedName} (all states)`, "info");
			}
		});
	}

	// ─── Single /animation command ───────────────────────────────
	pi.registerCommand("animation", {
		description: "Animated indicators: showcase, set <name>, width, on/off",
		getArgumentCompletions: (prefix) => {
			const items = [
				// Subcommands
				{ value: "showcase", label: "showcase", description: "Browse all animations interactively" },
				{ value: "on", label: "on", description: "Enable animations" },
				{ value: "off", label: "off", description: "Disable animations" },
				{ value: "random", label: "random", description: "Random animation each time" },
				// Width
				{ value: "width full", label: "width full", description: "Full terminal width" },
				{ value: "width default", label: "width default", description: "50 columns" },
				// Direct set (all states)
				...ANIMATIONS.map(a => ({
					value: a.name,
					label: a.name,
					description: `[${a.category}, ${a.lines}L] ${a.description}`,
				})),
				// Per-state
				...ANIMATIONS.map(a => ({
					value: `working:${a.name}`,
					label: `working:${a.name}`,
					description: `Working → ${a.description}`,
				})),
				...ANIMATIONS.map(a => ({
					value: `thinking:${a.name}`,
					label: `thinking:${a.name}`,
					description: `Thinking → ${a.description}`,
				})),
				...ANIMATIONS.map(a => ({
					value: `tool:${a.name}`,
					label: `tool:${a.name}`,
					description: `Tool → ${a.description}`,
				})),
			];
			if (!prefix) return items;
			return items.filter(i => i.value.startsWith(prefix));
		},
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();

			// ── No args: show status ──
			if (!arg) {
				const status = state.enabled
					? `Working: ${state.workingAnim}  •  Thinking: ${state.thinkingAnim}  •  Tool: ${state.toolAnim}  •  Width: ${state.width}${state.randomMode ? "  •  (random)" : ""}`
					: "Animations disabled";
				const list = ANIMATIONS.map(a =>
					`  ${a.name.padEnd(20)} [${a.category.padEnd(8)} ${a.lines}L] ${a.description}`
				).join("\n");
				ctx.ui.notify(`${status}\n\nAnimations:\n${list}\n\nUsage:\n  /animation showcase          Browse & pick\n  /animation <name>            Set all states\n  /animation working:<name>    Set working only\n  /animation thinking:<name>   Set thinking only\n  /animation tool:<name>       Set tool only\n  /animation width full|default|<n>\n  /animation on|off|random`, "info");
				return;
			}

			// ── showcase ──
			if (arg === "showcase") {
				await runShowcase(ctx);
				return;
			}

			// ── on/off/random ──
			if (arg === "off") {
				state.enabled = false;
				stopWorkingAnimation();
				stopThinkingTicker();
				ctx.ui.setWorkingMessage();
				persistConfig();
				ctx.ui.notify("Animations disabled", "info");
				return;
			}
			if (arg === "on") {
				state.enabled = true;
				state.randomMode = false;
				persistConfig();
				ctx.ui.notify(`Animations enabled`, "info");
				return;
			}
			if (arg === "random") {
				state.enabled = true;
				state.randomMode = true;
				persistConfig();
				ctx.ui.notify("Random mode enabled", "info");
				return;
			}

			// ── width ──
			if (arg.startsWith("width")) {
				const val = arg.slice(5).trim();
				if (!val) {
					ctx.ui.notify(`Width: ${state.width}`, "info");
					return;
				}
				if (val === "full") {
					state.width = "full";
				} else if (val === "default") {
					state.width = "default";
				} else {
					const n = parseInt(val, 10);
					if (isNaN(n) || n < 10) {
						ctx.ui.notify("Width: full | default | number >= 10", "error");
						return;
					}
					state.width = n;
				}
				persistConfig();
				ctx.ui.notify(`Width set to: ${state.width}`, "info");
				return;
			}

			// ── Set animation: "name" or "working:name" etc ──
			let target: "all" | "working" | "thinking" | "tool" = "all";
			let name = arg;
			if (arg.startsWith("working:")) { target = "working"; name = arg.slice(8); }
			else if (arg.startsWith("thinking:")) { target = "thinking"; name = arg.slice(9); }
			else if (arg.startsWith("tool:")) { target = "tool"; name = arg.slice(5); }

			const anim = getAnimation(name);
			if (!anim) {
				ctx.ui.notify(`Unknown: "${name}". Try /animation showcase`, "error");
				return;
			}

			state.enabled = true;
			state.randomMode = false;
			if (target === "all" || target === "working") state.workingAnim = name;
			if (target === "all" || target === "thinking") state.thinkingAnim = name;
			if (target === "all" || target === "tool") state.toolAnim = name;
			persistConfig();

			const msg = target === "all"
				? `All → ${name}`
				: `${target} → ${name}`;
			ctx.ui.notify(msg, "info");
		},
	});
}
