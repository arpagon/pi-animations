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

	// ─── Width Command ───────────────────────────────────────────
	pi.registerCommand("animation-width", {
		description: "Set animation width: full, default (50), or a number",
		getArgumentCompletions: (prefix) => {
			const items = [
				{ value: "full", label: "full", description: "Full terminal width" },
				{ value: "default", label: "default", description: "50 columns" },
				{ value: "80", label: "80", description: "80 columns" },
				{ value: "120", label: "120", description: "120 columns" },
			];
			if (!prefix) return items;
			return items.filter(i => i.value.startsWith(prefix));
		},
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			if (!arg) {
				ctx.ui.notify(`Current width: ${state.width}`, "info");
				return;
			}
			if (arg === "full") {
				state.width = "full";
			} else if (arg === "default") {
				state.width = "default";
			} else {
				const n = parseInt(arg, 10);
				if (isNaN(n) || n < 10) {
					ctx.ui.notify("Width must be 'full', 'default', or a number >= 10", "error");
					return;
				}
				state.width = n;
			}
			persistConfig();
			ctx.ui.notify(`Animation width set to: ${state.width}`, "info");
		},
	});

	// ─── Showcase Command ────────────────────────────────────────
	pi.registerCommand("animation-showcase", {
		description: "Cycle through all animations (Escape to stop, ←/→ to switch)",
		handler: async (_args, ctx) => {
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
							// Escape or q — exit
							clearInterval(timer);
							done(ANIMATIONS[idx].name);
						} else if (data === "\x1b[C" || data === "l" || data === "n") {
							// Right arrow, l, or n — next
							idx = (idx + 1) % ANIMATIONS.length;
							frame = 0;
						} else if (data === "\x1b[D" || data === "h" || data === "p") {
							// Left arrow, h, or p — prev
							idx = (idx - 1 + ANIMATIONS.length) % ANIMATIONS.length;
							frame = 0;
						} else if (data === "\r" || data === " ") {
							// Enter or space — select current
							clearInterval(timer);
							done(ANIMATIONS[idx].name);
						}
					},
					render(width: number): string[] {
						const anim = ANIMATIONS[idx];
						const raw = anim.fn(frame, Math.min(50, width - 4));
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
					ctx.ui.notify(`Selected: ${selectedName}. Use /animation ${selectedName} to apply.`, "info");
				}
			});
		},
	});

	// ─── Command ─────────────────────────────────────────────────
	pi.registerCommand("animation", {
		description: "Set thinking/working animation",
		getArgumentCompletions: (prefix) => {
			const items = [
				...ANIMATIONS.map(a => ({
					value: a.name,
					label: a.name,
					description: `[${a.category}] ${a.description}`,
				})),
				...ANIMATIONS.map(a => ({
					value: `working:${a.name}`,
					label: `working:${a.name}`,
					description: `Working only — ${a.description}`,
				})),
				...ANIMATIONS.map(a => ({
					value: `thinking:${a.name}`,
					label: `thinking:${a.name}`,
					description: `Thinking only — ${a.description}`,
				})),
				...ANIMATIONS.map(a => ({
					value: `tool:${a.name}`,
					label: `tool:${a.name}`,
					description: `Tool execution only — ${a.description}`,
				})),
				{ value: "random", label: "random", description: "Random animation each time" },
				{ value: "off", label: "off", description: "Disable animations" },
				{ value: "on", label: "on", description: "Enable animations" },
			];
			if (!prefix) return items;
			return items.filter(i => i.value.startsWith(prefix));
		},
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();

			if (!arg) {
				// Show current status
				const status = state.enabled
					? `Working: ${state.workingAnim}, Thinking: ${state.thinkingAnim}, Tool: ${state.toolAnim}, Width: ${state.width}${state.randomMode ? " (random)" : ""}`
					: "Animations disabled";
				const list = ANIMATIONS.map(a =>
					`  ${a.name.padEnd(20)} [${a.category.padEnd(8)}] ${a.description}`
				).join("\n");
				ctx.ui.notify(`${status}\n\nAvailable:\n${list}`, "info");
				return;
			}

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
				ctx.ui.notify(`Animations enabled: working=${state.workingAnim}, thinking=${state.thinkingAnim}`, "info");
				return;
			}

			if (arg === "random") {
				state.enabled = true;
				state.randomMode = true;
				persistConfig();
				ctx.ui.notify("Random animation mode enabled", "info");
				return;
			}

			// Parse: "name" or "working:name" or "thinking:name" or "tool:name"
			let target: "all" | "working" | "thinking" | "tool" = "all";
			let name = arg;
			if (arg.startsWith("working:")) { target = "working"; name = arg.slice(8); }
			else if (arg.startsWith("thinking:")) { target = "thinking"; name = arg.slice(9); }
			else if (arg.startsWith("tool:")) { target = "tool"; name = arg.slice(5); }

			const anim = getAnimation(name);
			if (!anim) {
				ctx.ui.notify(`Unknown animation: ${name}. Use /animation to see list.`, "error");
				return;
			}

			state.enabled = true;
			state.randomMode = false;
			if (target === "all" || target === "working") state.workingAnim = name;
			if (target === "all" || target === "thinking") state.thinkingAnim = name;
			if (target === "all" || target === "tool") state.toolAnim = name;

			persistConfig();
			const msg = target === "all"
				? `working=${name}, thinking=${name}, tool=${name}`
				: `${target}=${name}`;
			ctx.ui.notify(`Animation set: ${msg}`, "info");
		},
	});
}
