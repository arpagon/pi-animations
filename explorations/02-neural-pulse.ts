// Neural Pulse — Energy pulses traveling along nodes (1 line)
const N = 16
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const dim = rgb(60,60,80)
const pulse = [rgb(80,80,120),rgb(120,100,200),rgb(180,140,255),rgb(220,180,255),rgb(255,220,255),rgb(220,180,255),rgb(180,140,255)]
let f = 0
const render = () => {
  let line = ""
  for (let i = 0; i < N; i++) {
    const d = ((i-(f*0.5))%N+N)%N
    const pi = d < pulse.length ? Math.floor(d) : -1
    line += (pi >= 0 ? pulse[pi] : dim) + (pi >= 0 ? "●" : "○")
    if (i < N-1) { const cd=((i+0.5-(f*0.5))%N+N)%N; line += (cd<pulse.length?pulse[Math.min(Math.floor(cd),pulse.length-1)]:dim)+"──" }
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m02 Neural Pulse\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 80)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
