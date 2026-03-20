// Pac-Man Chase — Classic pac-man eating dots (1 line)
const W = 40
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const pac = [rgb(255,255,0)+"ᗧ", rgb(255,255,0)+"●"]
const ghost = rgb(255,80,80)+"ᗣ"
const dot = rgb(255,180,100)+"·"
const power = rgb(255,255,255)+"\x1b[1m●\x1b[22m"
let f = 0
const render = () => {
  const pp = f%(W+8), gp = (f-4+W+8)%(W+8)
  let line = ""
  for (let i = 0; i < W; i++) {
    if (i===pp%W && pp<W) line += pac[f%4<2?0:1]
    else if (i===gp%W && gp<W) line += ghost
    else if (i>pp||pp>=W) line += (i%8===0)?power:dot
    else line += " "
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m06 Pac-Man Chase\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 100)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
