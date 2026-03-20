// Vibe Typewriter — Themed text appearing char by char with sparkle cursor (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const vibes = [
  "Engaging warp drive...",
  "Running diagnostics...",
  "Recalibrating sensors...",
  "Scanning the horizon...",
  "Channeling the cosmos...",
  "Weaving neural threads...",
  "Parsing the matrix...",
]
const cursors = ["✦","✧","⚡","★","·"]
const textColor = rgb(200,200,220)
const cursorColors = [[255,220,100],[100,200,255],[255,100,200],[200,255,100]]
let f = 0, vibeIdx = 0, charIdx = 0, holdFrames = 0
const render = () => {
  const vibe = vibes[vibeIdx]
  if(holdFrames>0){
    holdFrames--
    if(holdFrames===0){vibeIdx=(vibeIdx+1)%vibes.length;charIdx=0}
  } else if(charIdx<vibe.length){
    charIdx++
  } else {
    holdFrames = 30 // hold completed text
  }
  const shown = vibe.slice(0,charIdx)
  const cc = cursorColors[f%cursorColors.length]
  const cursor = charIdx<vibe.length ? rgb(cc[0],cc[1],cc[2])+"\x1b[1m"+cursors[f%cursors.length]+"\x1b[22m" : ""
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m24 Vibe Typewriter\x1b[0m\n\n  ${textColor}${shown}${cursor}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 60)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
