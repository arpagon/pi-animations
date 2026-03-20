// Plasma Wave — 2-line plasma band
const W = 50, H = 2
const chars = " ·∘○◎●◉█"
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
let f = 0
const render = () => {
  let out = `\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m05 Plasma Wave\x1b[0m\n\n`
  for (let y = 0; y < H; y++) {
    out += "  "
    for (let x = 0; x < W; x++) {
      const v = (Math.sin(x*0.15+f*0.08)+Math.sin(y*0.5+f*0.12)+Math.sin((x+y)*0.1+f*0.06)+Math.sin(Math.sqrt(x*x+y*y)*0.15+f*0.1))/4
      const n = (v+1)/2
      const r = Math.round(Math.sin(n*Math.PI*2)*127+128)
      const g = Math.round(Math.sin(n*Math.PI*2+2.094)*127+128)
      const b = Math.round(Math.sin(n*Math.PI*2+4.189)*127+128)
      out += rgb(r,g,b) + chars[Math.floor(n*(chars.length-1))]
    }
    out += "\n"
  }
  process.stdout.write(out+"\x1b[0m")
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
