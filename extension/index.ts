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
import { ANIMATIONS, getAnimation, getAnimationsForCategory, type AnimationFn, type AnimCategory } from "./animations.js";

const PATCH_KEY = Symbol.for("pi.ext.animatedThinking.patch");
const STATE_KEY = Symbol.for("pi.ext.animatedThinking.state");

interface AnimState {
	workingAnim: string; // animation name for working state
	thinkingAnim: string; // animation name for thinking state
	randomMode: boolean;
	frame: number;
	workingTimer: ReturnType<typeof setInterval> | null;
	thinkingTimer: ReturnType<typeof setInterval> | null;
	thinkingLabels: Map<string, Text>;
	theme?: ExtensionContext["ui"]["theme"];
	enabled: boolean;
}

function getState(): AnimState {
	return (globalThis as any)[STATE_KEY];
}

function renderFrame(animName: string, frame: number, width: number): string {
	const anim = getAnimation(animName);
	if (!anim) return "Thinking...";
	return anim.fn(frame, width);
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
		randomMode: false,
		frame: 0,
		workingTimer: null,
		thinkingTimer: null,
		thinkingLabels: new Map(),
		theme: undefined,
		enabled: true,
	};
	(globalThis as any)[STATE_KEY] = state;
	ensurePatch();

	// ─── Working animation ───────────────────────────────────────
	function startWorkingAnimation(ctx: ExtensionContext) {
		stopWorkingAnimation();
		if (!state.enabled) return;
		state.frame = 0;
		const animName = state.randomMode ? pickRandom("working") : state.workingAnim;
		state.workingTimer = setInterval(() => {
			state.frame++;
			const rendered = renderFrame(animName, state.frame, 50);
			ctx.ui.setWorkingMessage(rendered);
		}, 60);
	}

	function stopWorkingAnimation() {
		if (state.workingTimer) {
			clearInterval(state.workingTimer);
			state.workingTimer = null;
		}
	}

	// ─── Thinking animation tick ─────────────────────────────────
	function startThinkingTicker() {
		if (state.thinkingTimer) return;
		state.thinkingTimer = setInterval(() => {
			state.frame++;
			const animName = state.randomMode ? pickRandom("thinking") : state.thinkingAnim;
			for (const [, label] of state.thinkingLabels) {
				label.setText(renderFrame(animName, state.frame, 60));
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
		stopWorkingAnimation();
		stopThinkingTicker();
		ctx.ui.setWorkingMessage(); // restore default
	});

	pi.on("message_update", async (event, ctx) => {
		state.theme = ctx.ui.theme;
		const se = event.assistantMessageEvent as any;
		if (!se || typeof se.type !== "string") return;
		if (se.type === "thinking_start" || se.type === "thinking_delta") {
			if (state.enabled) startThinkingTicker();
		}
		if (se.type === "thinking_end") {
			// Keep label with final frame
		}
	});

	pi.on("message_end", async () => {
		stopThinkingTicker();
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

	// ─── Command ─────────────────────────────────────────────────
	pi.registerCommand("animation", {
		description: "Set thinking/working animation",
		getArgumentCompletions: (prefix) => {
			const items = [
				...ANIMATIONS.map(a => ({
					text: a.name,
					description: `[${a.category}] ${a.description}`,
				})),
				{ text: "random", description: "Random animation each time" },
				{ text: "off", description: "Disable animations" },
				{ text: "on", description: "Enable animations" },
			];
			if (!prefix) return items;
			return items.filter(i => i.text.startsWith(prefix));
		},
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();

			if (!arg) {
				// Show current status
				const status = state.enabled
					? `Working: ${state.workingAnim}, Thinking: ${state.thinkingAnim}${state.randomMode ? " (random)" : ""}`
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

			// Parse: "name" or "working:name" or "thinking:name"
			let target: "both" | "working" | "thinking" = "both";
			let name = arg;
			if (arg.startsWith("working:")) { target = "working"; name = arg.slice(8); }
			else if (arg.startsWith("thinking:")) { target = "thinking"; name = arg.slice(9); }

			const anim = getAnimation(name);
			if (!anim) {
				ctx.ui.notify(`Unknown animation: ${name}. Use /animation to see list.`, "error");
				return;
			}

			state.enabled = true;
			state.randomMode = false;
			if (target === "both" || target === "working") state.workingAnim = name;
			if (target === "both" || target === "thinking") state.thinkingAnim = name;

			ctx.ui.notify(`Animation set: ${target === "both" ? `working=${name}, thinking=${name}` : `${target}=${name}`}`, "info");
		},
	});
}
