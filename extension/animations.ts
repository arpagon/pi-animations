/**
 * Animation renderers — each returns a single ANSI-colored string per frame.
 * All animations are pure functions: (frame, width, theme?) => string
 */

const rgb = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`;
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const reset = "\x1b[0m";
const nobold = "\x1b[22m";

// Pi gradient (nicobailon style): magenta → purple → cyan
const PI_GRAD = [
	[255, 0, 135], [175, 95, 175], [135, 95, 215],
	[95, 95, 255], [95, 175, 255], [0, 255, 255],
];

function hsl(h: number, s = 1, l = 0.5): string {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0, g = 0, b = 0;
	if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
	else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
	else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
	return rgb(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

function lerpGrad(grad: number[][], t: number): [number, number, number] {
	const i = Math.floor(t * (grad.length - 1));
	const i2 = Math.min(i + 1, grad.length - 1);
	const lt = (t * (grad.length - 1)) % 1;
	return [
		Math.round(grad[i][0] + (grad[i2][0] - grad[i][0]) * lt),
		Math.round(grad[i][1] + (grad[i2][1] - grad[i][1]) * lt),
		Math.round(grad[i][2] + (grad[i2][2] - grad[i][2]) * lt),
	];
}

const ellipsis = (f: number) => [".", "..", "...", ""][Math.floor(f / 10) % 4];

export type AnimationFn = (frame: number, width: number) => string;

// ─── 02 Neural Pulse ─────────────────────────────────────────────
export const neuralPulse: AnimationFn = (f, w) => {
	const N = Math.min(14, Math.floor(w / 4));
	const d = rgb(60, 60, 80);
	const pulse = [rgb(80, 80, 120), rgb(120, 100, 200), rgb(180, 140, 255), rgb(220, 180, 255), rgb(255, 220, 255), rgb(220, 180, 255), rgb(180, 140, 255)];
	let line = "";
	for (let i = 0; i < N; i++) {
		const dist = ((i - (f * 0.5)) % N + N) % N;
		const pi = dist < pulse.length ? Math.floor(dist) : -1;
		line += (pi >= 0 ? pulse[pi] : d) + (pi >= 0 ? "●" : "○");
		if (i < N - 1) { const cd = ((i + 0.5 - (f * 0.5)) % N + N) % N; line += (cd < pulse.length ? pulse[Math.min(Math.floor(cd), pulse.length - 1)] : d) + "──"; }
	}
	return line + reset;
};

// ─── 03 Glitch Text ──────────────────────────────────────────────
export const glitchText: AnimationFn = (f) => {
	const text = "Thinking";
	const glyphs = "█▓▒░╳╱╲¥£€$#@!?&%~*";
	const colors = [rgb(0, 255, 200), rgb(255, 0, 100), rgb(100, 200, 255), rgb(255, 255, 0)];
	let line = "";
	for (let i = 0; i < text.length; i++) {
		if (Math.random() < 0.12) line += colors[Math.floor(Math.random() * colors.length)] + glyphs[Math.floor(Math.random() * glyphs.length)];
		else if (Math.random() < 0.06) line += rgb(0, 255, 200) + (text[Math.min(Math.max(i + (Math.random() < 0.5 ? -1 : 1), 0), text.length - 1)] || " ");
		else line += bold + rgb(255, 255, 255) + text[i] + nobold;
	}
	const jitter = Math.random() < 0.1 ? " ".repeat(Math.floor(Math.random() * 3)) : "";
	return jitter + line + reset;
};

// ─── 05 Plasma Wave (1-line) ─────────────────────────────────────
export const plasmaWave: AnimationFn = (f, w) => {
	const chars = " ·∘○◎●◉█";
	const W = Math.min(50, w);
	let line = "";
	for (let x = 0; x < W; x++) {
		const v = (Math.sin(x * 0.15 + f * 0.08) + Math.sin(x * 0.1 + f * 0.06) + Math.sin(Math.sqrt(x * x) * 0.15 + f * 0.1)) / 3;
		const n = (v + 1) / 2;
		const r = Math.round(Math.sin(n * Math.PI * 2) * 127 + 128);
		const g = Math.round(Math.sin(n * Math.PI * 2 + 2.094) * 127 + 128);
		const b = Math.round(Math.sin(n * Math.PI * 2 + 4.189) * 127 + 128);
		line += rgb(r, g, b) + chars[Math.floor(n * (chars.length - 1))];
	}
	return line + reset;
};

// ─── 06 Pac-Man Chase ────────────────────────────────────────────
export const pacmanChase: AnimationFn = (f, w) => {
	const W = Math.min(40, w);
	const pac = [rgb(255, 255, 0) + "ᗧ", rgb(255, 255, 0) + "●"];
	const ghost = rgb(255, 80, 80) + "ᗣ";
	const dot = rgb(255, 180, 100) + "·";
	const power = bold + rgb(255, 255, 255) + "●" + nobold;
	const pp = f % (W + 8), gp = (f - 4 + W + 8) % (W + 8);
	let line = "";
	for (let i = 0; i < W; i++) {
		if (i === pp % W && pp < W) line += pac[f % 4 < 2 ? 0 : 1];
		else if (i === gp % W && gp < W) line += ghost;
		else if (i > pp || pp >= W) line += (i % 8 === 0) ? power : dot;
		else line += " ";
	}
	return line + reset;
};

// ─── 07 Matrix Rain (1-line) ─────────────────────────────────────
const matrixDrops: { x: number; phase: number; speed: number }[] = [];
for (let i = 0; i < 20; i++) matrixDrops.push({ x: Math.floor(Math.random() * 50), phase: Math.random() * 100, speed: 0.3 + Math.random() * 0.5 });
const matrixChars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘ012789Z";
export const matrixRain: AnimationFn = (f, w) => {
	const W = Math.min(50, w);
	const buf = new Array(W).fill(" ");
	for (const d of matrixDrops) {
		const pos = Math.floor((f * d.speed + d.phase) % (W + 5));
		if (pos < W) buf[pos] = rgb(0, 255, 0) + bold + matrixChars[Math.floor(Math.random() * matrixChars.length)] + nobold;
		if (pos - 1 >= 0 && pos - 1 < W && buf[pos - 1] === " ") buf[pos - 1] = rgb(0, 160, 0) + matrixChars[Math.floor(Math.random() * matrixChars.length)];
		if (pos - 2 >= 0 && pos - 2 < W && buf[pos - 2] === " ") buf[pos - 2] = rgb(0, 80, 0) + matrixChars[Math.floor(Math.random() * matrixChars.length)];
	}
	return buf.join("") + reset;
};

// ─── 08 Pipeline ─────────────────────────────────────────────────
export const pipeline: AnimationFn = (f) => {
	const icons = [
		{ i: "\uf0e7", c: rgb(255, 200, 50) }, { i: "\uf013", c: rgb(100, 180, 255) },
		{ i: "\uf121", c: rgb(150, 255, 150) }, { i: "\uf0ad", c: rgb(255, 150, 100) }, { i: "\uf00c", c: rgb(100, 255, 200) }
	];
	const pw = 5, total = icons.length * (pw + 1) + 1, pp = (f * 0.4) % total;
	let line = "";
	for (let i = 0; i < icons.length; i++) {
		const ss = i * (pw + 1), active = pp >= ss && pp < ss + pw + 1;
		line += (active ? bold : dim) + icons[i].c + icons[i].i + " " + reset;
		if (i < icons.length - 1) for (let p = 0; p < pw; p++) { const pos = ss + 1 + p; line += (Math.abs(pp - pos) < 1.5 ? bold + rgb(255, 255, 255) + "═" : pp > pos ? icons[i].c + "─" : rgb(60, 60, 80) + "─"); }
	}
	return line + reset;
};

// ─── 10 Starfield ────────────────────────────────────────────────
const starChars = ["·", "∙", "•", "✦", "★"];
type Star = { x: number; speed: number; bright: number; ch: string };
const stars: Star[] = Array.from({ length: 30 }, () => {
	const speed = 0.2 + Math.random() * 1.2;
	const layer = Math.floor(speed / 0.3);
	return { x: Math.random() * 55, speed, bright: Math.min(255, 80 + layer * 40), ch: starChars[Math.min(layer, starChars.length - 1)] };
});
export const starfield: AnimationFn = (f, w) => {
	const W = Math.min(55, w);
	const buf = new Array(W).fill(" ");
	for (const s of stars) {
		const xi = Math.floor(s.x);
		if (xi >= 0 && xi < W) buf[xi] = rgb(s.bright, s.bright, Math.min(255, s.bright + 40)) + s.ch;
		s.x += s.speed;
		if (s.x >= W) { s.x = 0; s.speed = 0.2 + Math.random() * 1.2; const l = Math.floor(s.speed / 0.3); s.bright = Math.min(255, 80 + l * 40); s.ch = starChars[Math.min(l, starChars.length - 1)]; }
	}
	return buf.join("") + reset;
};

// ─── 12 Fire ─────────────────────────────────────────────────────
const fireChars = " .:-=+*#%@█";
const firePalette = [[0, 0, 0], [50, 0, 0], [120, 30, 0], [200, 80, 0], [240, 160, 30], [255, 230, 120], [255, 255, 200]];
const fireBuf = Array.from({ length: 4 }, () => new Float64Array(45));
export const fire: AnimationFn = (f, w) => {
	const W = Math.min(45, w);
	for (let x = 0; x < W; x++) fireBuf[3][x] = Math.random() > 0.35 ? 1 : Math.random() * 0.5;
	for (let y = 0; y < 3; y++) for (let x = 0; x < W; x++)
		fireBuf[y][x] = (fireBuf[y + 1][(x - 1 + W) % W] + fireBuf[y + 1][x] + fireBuf[y + 1][(x + 1) % W]) / 3.1;
	let line = "";
	for (let x = 0; x < W; x++) {
		const v = Math.min(1, Math.max(0, fireBuf[0][x]));
		const pi = Math.floor(v * (firePalette.length - 1));
		const ci = Math.floor(v * (fireChars.length - 1));
		const [r, g, b] = firePalette[pi];
		line += rgb(r, g, b) + fireChars[ci];
	}
	return line + reset;
};

// ─── 15 Icon Morphing ────────────────────────────────────────────
const morphIcons = [
	{ ch: "\uf0eb", r: 255, g: 220, b: 50 }, { ch: "\uf013", r: 100, g: 180, b: 255 },
	{ ch: "\uf0e7", r: 255, g: 150, b: 50 }, { ch: "\uf135", r: 255, g: 100, b: 100 },
	{ ch: "\uf005", r: 255, g: 255, b: 100 }, { ch: "\uf06d", r: 255, g: 120, b: 30 },
	{ ch: "\uf0ac", r: 100, g: 200, b: 255 }, { ch: "\uf004", r: 255, g: 80, b: 120 }
];
const trans = "░▒▓█▓▒░";
export const iconMorphing: AnimationFn = (f) => {
	const cd = 25, pos = f % (morphIcons.length * cd);
	const ci = Math.floor(pos / cd), ni = (ci + 1) % morphIcons.length, p = (pos % cd) / cd;
	const cur = morphIcons[ci], nxt = morphIcons[ni];
	const r = Math.round(cur.r + (nxt.r - cur.r) * p), g = Math.round(cur.g + (nxt.g - cur.g) * p), b = Math.round(cur.b + (nxt.b - cur.b) * p);
	let display = p < 0.3 ? cur.ch : p < 0.7 ? trans[Math.min(Math.floor((p - 0.3) / 0.4 * trans.length), trans.length - 1)] : nxt.ch;
	let trail = "";
	for (let i = 0; i < 20; i++) { const sp = Math.random() < 0.25 ? (Math.random() < 0.5 ? "✦" : "·") : " "; const br = Math.floor(Math.random() * 155 + 100); trail += rgb(br, br, Math.floor(br * 0.8)) + sp; }
	return rgb(r, g, b) + display + "  " + trail + reset;
};

// ─── 16 Brainstorm ───────────────────────────────────────────────
const weatherPhases = [
	{ icon: "\ue30d", label: "calm", r: 255, g: 200, b: 50 },
	{ icon: "\ue302", label: "thinking.", r: 180, g: 180, b: 200 },
	{ icon: "\ue318", label: "thinking..", r: 140, g: 140, b: 180 },
	{ icon: "\ue31d", label: "EUREKA!", r: 255, g: 255, b: 100 },
	{ icon: "\ue30b", label: "insight!", r: 255, g: 220, b: 100 },
	{ icon: "\ue302", label: "processing", r: 160, g: 160, b: 190 }
];
export const brainstorm: AnimationFn = (f) => {
	const pd = 35, pos = f % (weatherPhases.length * pd), pi = Math.floor(pos / pd), p = weatherPhases[pi];
	const glow = Math.sin(f * 0.15) * 30;
	const r = Math.min(255, Math.max(0, p.r + glow)), g = Math.min(255, Math.max(0, p.g + glow)), b = Math.min(255, Math.max(0, p.b + glow));
	let sparks = "";
	for (let i = 0; i < 15; i++) { if (Math.random() < 0.15) { const br = Math.floor(Math.random() * 100 + 155); sparks += rgb(br, br, Math.min(255, br + 50)) + (Math.random() < 0.3 ? "⚡" : "✦"); } else sparks += " "; }
	return rgb(r, g, b) + bold + p.icon + "  " + p.label + nobold + " " + sparks + reset;
};

// ─── 19 Dev Constellation ────────────────────────────────────────
const devNodes = [
	{ ch: "\ue796", c: [50, 150, 255] }, { ch: "\ue718", c: [80, 200, 120] }, { ch: "\ue73c", c: [255, 200, 50] },
	{ ch: "\ue7a8", c: [200, 100, 255] }, { ch: "\uf13b", c: [100, 200, 255] }, { ch: "\ue61e", c: [255, 100, 100] }
];
export const devConstellation: AnimationFn = (f) => {
	const gap = 5, totalW = devNodes.length * (gap + 1) - 1, pp = (f * 0.4) % totalW;
	let line = "";
	for (let i = 0; i < devNodes.length; i++) {
		const np = i * (gap + 1), dist = Math.abs(pp - np);
		line += (dist < 1.5 ? bold : dim) + rgb(devNodes[i].c[0], devNodes[i].c[1], devNodes[i].c[2]) + devNodes[i].ch + nobold;
		if (i < devNodes.length - 1) for (let g = 0; g < gap; g++) { const cp = np + 1 + g, cd = Math.abs(pp - cp); line += (cd < 1 ? bold + rgb(255, 255, 255) + "━" : cd < 2.5 ? rgb(150, 150, 200) + "─" : rgb(40, 40, 55) + "·"); }
	}
	return line + reset;
};

// ─── 20 Crush Scramble ───────────────────────────────────────────
const scrambleChars = "0123456789abcdefABCDEF~!@#$£€%^&*()+=_";
const scrambleBirths = Array.from({ length: 15 }, () => Math.random() * 20);
const scrambleRamp: number[][] = [];
for (let i = 0; i < 24; i++) { const t = i / 24, a = t * Math.PI * 2; scrambleRamp.push([Math.round(Math.sin(a) * 127 + 128), Math.round(Math.sin(a + 2.094) * 80 + 80), Math.round(Math.sin(a + 4.189) * 127 + 128)]); }
export const crushScramble: AnimationFn = (f) => {
	const sw = 15, init = f > 20;
	let line = "";
	for (let i = 0; i < sw; i++) {
		const ci = (i + (init ? f : 0)) % scrambleRamp.length, [r, g, b] = scrambleRamp[ci];
		line += rgb(r, g, b) + (!init && f < scrambleBirths[i] ? "." : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]);
	}
	line += " " + rgb(200, 200, 200) + "Thinking";
	if (init) line += rgb(200, 200, 200) + ellipsis(f);
	return line + reset;
};

// ─── 21 Pi Logo Pulse ────────────────────────────────────────────
export const piLogoPulse: AnimationFn = (f) => {
	const piGlyph = "\ue22c", label = "";
	const breath = (Math.sin(f * 0.08) + 1) / 2;
	const gi = Math.floor((f * 0.3) % PI_GRAD.length);
	const gi2 = (gi + 1) % PI_GRAD.length;
	const t = (f * 0.3) % 1;
	const r = Math.round(PI_GRAD[gi][0] + (PI_GRAD[gi2][0] - PI_GRAD[gi][0]) * t);
	const g = Math.round(PI_GRAD[gi][1] + (PI_GRAD[gi2][1] - PI_GRAD[gi][1]) * t);
	const b = Math.round(PI_GRAD[gi][2] + (PI_GRAD[gi2][2] - PI_GRAD[gi][2]) * t);
	const br = 0.6 + breath * 0.4;
	const trailChars = "·∘○◎●";
	let trail = "";
	for (let i = 0; i < 20; i++) {
		const phase = (i / 20 * Math.PI * 2 + f * 0.1), ti = Math.floor((Math.sin(phase) + 1) / 2 * (trailChars.length - 1));
		const fade = Math.max(30, 200 - i * 8);
		trail += rgb(Math.floor(r * fade / 255), Math.floor(g * fade / 255), Math.floor(b * fade / 255)) + trailChars[ti];
	}
	return bold + rgb(Math.round(r * br), Math.round(g * br), Math.round(b * br)) + piGlyph + label + nobold + "  " + trail + reset;
};

// ─── 22 Shimmer Text ─────────────────────────────────────────────
export const shimmerText: AnimationFn = (f) => {
	const text = "Thinking...";
	const base = [200, 200, 200];
	let line = "";
	for (let i = 0; i < text.length; i++) {
		const wave = Math.sin((i - f * 0.3) * 0.8);
		if (wave > 0.3) {
			const intensity = (wave - 0.3) / 0.7;
			const gi = Math.floor(((i + f * 0.5) % (PI_GRAD.length * 2)));
			const gIdx = gi < PI_GRAD.length ? gi : PI_GRAD.length * 2 - 1 - gi;
			const gc = PI_GRAD[Math.min(gIdx, PI_GRAD.length - 1)];
			line += bold + rgb(Math.round(base[0] + (gc[0] - base[0]) * intensity), Math.round(base[1] + (gc[1] - base[1]) * intensity), Math.round(base[2] + (gc[2] - base[2]) * intensity)) + text[i] + nobold;
		} else {
			line += rgb(base[0], base[1], base[2]) + text[i];
		}
	}
	return line + reset;
};

// ─── 24 Vibe Typewriter ──────────────────────────────────────────
const vibeMessages = [
	"Engaging warp drive...", "Running diagnostics...", "Recalibrating sensors...",
	"Scanning the horizon...", "Channeling the cosmos...", "Weaving neural threads...", "Parsing the matrix...",
];
const cursorChars = ["✦", "✧", "⚡", "★", "·"];
const cursorColors = [[255, 220, 100], [100, 200, 255], [255, 100, 200], [200, 255, 100]];
let vibeIdx = 0, vibeCharIdx = 0, vibeHold = 0;
export const vibeTypewriter: AnimationFn = (f) => {
	const vibe = vibeMessages[vibeIdx];
	if (vibeHold > 0) { vibeHold--; if (vibeHold === 0) { vibeIdx = (vibeIdx + 1) % vibeMessages.length; vibeCharIdx = 0; } }
	else if (vibeCharIdx < vibe.length) vibeCharIdx++;
	else vibeHold = 30;
	const shown = vibe.slice(0, vibeCharIdx);
	const cc = cursorColors[f % cursorColors.length];
	const cursor = vibeCharIdx < vibe.length ? rgb(cc[0], cc[1], cc[2]) + bold + cursorChars[f % cursorChars.length] + nobold : "";
	return rgb(200, 200, 220) + shown + cursor + reset;
};

// ─── 26 Orbit Dots ───────────────────────────────────────────────
const dotChars = ["·", "∘", "○", "●", "◉", "●", "○", "∘"];
export const orbitDots: AnimationFn = (f) => {
	let line = "";
	for (let i = 0; i < 5; i++) {
		const phase = Math.sin(f * 0.12 - i * 0.8), norm = (phase + 1) / 2;
		const ci = Math.floor(norm * (dotChars.length - 1));
		const [r, g, b] = lerpGrad(PI_GRAD, ((i + f * 0.1) % PI_GRAD.length) / PI_GRAD.length);
		const br = 0.4 + norm * 0.6;
		line += (norm > 0.7 ? bold : "") + rgb(Math.round(r * br), Math.round(g * br), Math.round(b * br)) + dotChars[ci] + nobold + " ";
	}
	const [lr, lg, lb] = lerpGrad(PI_GRAD, (f * 0.08 % PI_GRAD.length) / PI_GRAD.length);
	line += "  " + rgb(lr, lg, lb) + "Thinking" + rgb(180, 180, 200) + ellipsis(f);
	return line + reset;
};

// ─── 27 Neon Bounce ──────────────────────────────────────────────
const bounceTrail: { pos: number; age: number; color: number[] }[] = [];
const trailGlyphs = ["█", "▓", "▒", "░", "·"];
export const neonBounce: AnimationFn = (f, w) => {
	const W = Math.min(35, w);
	const cycle = (f * 0.6) % (W * 2), pos = Math.floor(cycle < W ? cycle : W * 2 - cycle);
	const [r, g, b] = lerpGrad(PI_GRAD, pos / W);
	bounceTrail.push({ pos, age: 0, color: [r, g, b] });
	const buf = new Array(W).fill(" ");
	for (const t of bounceTrail) {
		if (t.age < trailGlyphs.length && t.pos < W) {
			const fade = Math.max(0, 1 - t.age / 5);
			buf[t.pos] = rgb(Math.round(t.color[0] * fade), Math.round(t.color[1] * fade), Math.round(t.color[2] * fade)) + trailGlyphs[Math.min(t.age, trailGlyphs.length - 1)];
		}
		t.age++;
	}
	if (pos < W) buf[pos] = bold + rgb(Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 50)) + "█" + nobold;
	while (bounceTrail.length > 0 && bounceTrail[0].age > 5) bounceTrail.shift();
	return rgb(80, 80, 100) + "▐" + buf.join("") + rgb(80, 80, 100) + "▌" + reset;
};

// ─── Registry ────────────────────────────────────────────────────
export type AnimCategory = "thinking" | "working" | "both";

export interface AnimationDef {
	name: string;
	fn: AnimationFn;
	category: AnimCategory;
	description: string;
}

export const ANIMATIONS: AnimationDef[] = [
	{ name: "neural-pulse", fn: neuralPulse, category: "thinking", description: "Energy pulses along neural pathway" },
	{ name: "glitch-text", fn: glitchText, category: "both", description: "Cyberpunk glitch effect" },
	{ name: "plasma-wave", fn: plasmaWave, category: "thinking", description: "Colorful plasma band" },
	{ name: "pacman", fn: pacmanChase, category: "working", description: "Pac-Man eating dots" },
	{ name: "matrix", fn: matrixRain, category: "both", description: "Matrix rain" },
	{ name: "pipeline", fn: pipeline, category: "working", description: "CI/CD pipeline with icons" },
	{ name: "starfield", fn: starfield, category: "thinking", description: "Horizontal parallax stars" },
	{ name: "fire", fn: fire, category: "working", description: "Demoscene fire" },
	{ name: "icon-morph", fn: iconMorphing, category: "both", description: "Morphing nerd font icons" },
	{ name: "brainstorm", fn: brainstorm, category: "thinking", description: "Weather icon storm" },
	{ name: "dev-constellation", fn: devConstellation, category: "thinking", description: "Dev icons with pulses" },
	{ name: "crush", fn: crushScramble, category: "both", description: "Crush-style scrambler" },
	{ name: "pi-pulse", fn: piLogoPulse, category: "both", description: "Pi logo with gradient pulse" },
	{ name: "shimmer", fn: shimmerText, category: "thinking", description: "Rainbow shimmer text" },
	{ name: "typewriter", fn: vibeTypewriter, category: "both", description: "Themed typewriter text" },
	{ name: "orbit-dots", fn: orbitDots, category: "thinking", description: "Pulsing orbit dots" },
	{ name: "neon-bounce", fn: neonBounce, category: "working", description: "Neon ball bouncing" },
];

export function getAnimation(name: string): AnimationDef | undefined {
	return ANIMATIONS.find(a => a.name === name);
}

export function getAnimationsForCategory(cat: AnimCategory): AnimationDef[] {
	return ANIMATIONS.filter(a => a.category === cat || a.category === "both");
}
