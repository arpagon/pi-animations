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
import { AssistantMessageComponent } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { ANIMATIONS, getAnimation, getAnimationsForCategory, type AnimationFn, type AnimCategory, type AnimPhase } from "./animations.js";

const PATCH_KEY = Symbol.for("pi.ext.animatedThinking.patch");
const STATE_KEY = Symbol.for("pi.ext.animatedThinking.state");

interface AnimState {
	workingAnim: string; // animation name for working state
	thinkingAnim: string; // animation name for thinking state
	toolAnim: string; // animation name for tool execution
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

function renderFrame(animName: string, frame: number, width: number, phase?: AnimPhase): string {
	const anim = getAnimation(animName);
	if (!anim) return "Working...";
	return anim.fn(frame, width, phase);
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
	const state: AnimState = {
		workingAnim: "crush",
		thinkingAnim: "shimmer",
		toolAnim: "pipeline",
		randomMode: false,
		frame: 0,
		workingTimer: null,
		thinkingTimer: null,
		thinkingLabels: new Map(),
		theme: undefined,
		enabled: true,
		isThinking: false,
		isToolRunning: false,
		currentWorkingCtx: null,
	};
	(globalThis as any)[STATE_KEY] = state;
	ensurePatch();

	// ─── Working animation ───────────────────────────────────────
	function startWorkingAnimation(ctx: ExtensionContext) {
		stopWorkingAnimation();
		if (!state.enabled) return;
		state.frame = 0;
		state.currentWorkingCtx = ctx;
		// Pick initial animations (will switch dynamically based on state)
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
			const rendered = renderFrame(animName, state.frame, 50, phase);
			ctx.ui.setWorkingMessage(rendered);
		}, 60);
	}

	function stopWorkingAnimation() {
		if (state.workingTimer) {
			clearInterval(state.workingTimer);
			state.workingTimer = null;
		}
		state.currentWorkingCtx = null;
	}

	// ─── Thinking animation tick ─────────────────────────────────
	function startThinkingTicker() {
		if (state.thinkingTimer) return;
		state.thinkingTimer = setInterval(() => {
			state.frame++;
			const animName = state.randomMode ? pickRandom("thinking") : state.thinkingAnim;
			for (const [, label] of state.thinkingLabels) {
				label.setText(renderFrame(animName, state.frame, 60, "thinking"));
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
		stopWorkingAnimation();
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
		stopWorkingAnimation();
		stopThinkingTicker();
		ctx.ui.setWorkingMessage();
	});

	pi.on("session_shutdown", async () => {
		stopWorkingAnimation();
		stopThinkingTicker();
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
						const rendered = anim.fn(frame, Math.min(50, width - 4));
						const lines: string[] = [];
						lines.push("");
						lines.push(theme.fg("accent", "  ▶ Animation Showcase"));
						lines.push("");
						lines.push(`  ${rendered}`);
						lines.push("");
						lines.push(
							theme.fg("muted", `  [${idx + 1}/${ANIMATIONS.length}] `) +
							theme.fg("text", anim.name) +
							theme.fg("muted", ` (${anim.category}) — ${anim.description}`)
						);
						lines.push("");
						lines.push(theme.fg("dim", "  ←/→ switch  •  Enter/Space select  •  Esc quit"));
						lines.push("");
						return lines;
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
					? `Working: ${state.workingAnim}, Thinking: ${state.thinkingAnim}, Tool: ${state.toolAnim}${state.randomMode ? " (random)" : ""}`
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
				ctx.ui.notify("Animations disabled", "info");
				return;
			}

			if (arg === "on") {
				state.enabled = true;
				state.randomMode = false;
				ctx.ui.notify(`Animations enabled: working=${state.workingAnim}, thinking=${state.thinkingAnim}`, "info");
				return;
			}

			if (arg === "random") {
				state.enabled = true;
				state.randomMode = true;
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

			const msg = target === "all"
				? `working=${name}, thinking=${name}, tool=${name}`
				: `${target}=${name}`;
			ctx.ui.notify(`Animation set: ${msg}`, "info");
		},
	});
}
