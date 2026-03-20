// Glitch Text — "Thinking" with cyberpunk glitch (1 line)
const text = "Thinking"
const glitch = "█▓▒░╳╱╲¥£€$#@!?&%~*"
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const colors = [rgb(0,255,200),rgb(255,0,100),rgb(100,200,255),rgb(255,255,0)]
let f = 0
const render = () => {
  let line = ""
  for (let i = 0; i < text.length; i++) {
    if (Math.random() < 0.12) {
      line += colors[Math.floor(Math.random()*colors.length)] + glitch[Math.floor(Math.random()*glitch.length)]
    } else if (Math.random() < 0.06) {
      const off = Math.random()<0.5?-1:1
      line += rgb(0,255,200) + (text[Math.min(Math.max(i+off,0),text.length-1)]||" ")
    } else {
      line += `\x1b[1m${rgb(255,255,255)}${text[i]}`
    }
  }
  // Random jitter
  const jitter = Math.random()<0.1 ? " ".repeat(Math.floor(Math.random()*3)) : ""
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m03 Glitch Text\x1b[0m\n\n  ${jitter}${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 80)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
