/**
 * Spinner data module
 *
 * Frame presets for the integrated pi-animations + spinner extension.
 */

// ─── Types ────────────────────────────────────────────────────────

export type FramePreset = "claude" | "braille" | "pulse" | "dot" | "star" | "none";

export interface FrameConfig {
	frames: string[];
	intervalMs: number;
}

// ─── Frame Presets ────────────────────────────────────────────────

type FramePresets = Record<FramePreset, FrameConfig>;

export const FRAME_PRESETS: FramePresets = {
	/** Claude Code's bespoke 6-frame asterisk/star sequence */
	claude: {
		frames: ["·", "✢", "✳", "✶", "✻", "✽"],
		intervalMs: 100,
	},
	/** Standard Braille dots (pi's default) */
	braille: {
		frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
		intervalMs: 80,
	},
	/** Simple pulse animation */
	pulse: {
		frames: ["·", "•", "●", "•"],
		intervalMs: 120,
	},
	/** Static dot — no animation */
	dot: {
		frames: ["●"],
		intervalMs: 0,
	},
	/** Star / sparkle variants */
	star: {
		frames: ["✧", "★", "✦", "✶", "✹"],
		intervalMs: 100,
	},
	/** Hidden — no indicator shown */
	none: {
		frames: [],
		intervalMs: 0,
	},
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Pretty-print a frame list for display */
export function formatFrames(frames: string[]): string {
	if (frames.length === 0) return "(none)";
	if (frames.length === 1) return frames[0]!;
	return frames.join(" ");
}

/** Get frame preset by key, fallback to braille */
export function getFrameConfig(key: string): FrameConfig {
	const preset = FRAME_PRESETS[key as FramePreset];
	return preset ?? FRAME_PRESETS.braille;
}
