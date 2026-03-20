// Pi Logo Gradient Pulse — π glyph with nicobailon's magenta→cyan gradient cycling
const piGlyph = "\ue22c" // nf-oct-pi
const label = " pi"
// nicobailon's gradient: magenta(199)→purple(171)→indigo(135)→indigo(99)→blue(75)→cyan(51)
const grad = [
  [255,0,135],[175,95,175],[135,95,215],[95,95,255],[95,175,255],[0,255,255],
  [95,175,255],[95,95,255],[135,95,215],[175,95,175] // bounce back
]
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
let f = 0
const render = () => {
  // Breathing brightness
  const breath = (Math.sin(f*0.08)+1)/2
  const gi = Math.floor((f*0.3)%grad.length)
  const gi2 = (gi+1)%grad.length
  const t = (f*0.3)%1
  const r = Math.round(grad[gi][0]+(grad[gi2][0]-grad[gi][0])*t)
  const g = Math.round(grad[gi][1]+(grad[gi2][1]-grad[gi][1])*t)
  const b = Math.round(grad[gi][2]+(grad[gi2][2]-grad[gi][2])*t)
  const br = 0.6+breath*0.4
  const fr=Math.round(r*br),fg=Math.round(g*br),fb=Math.round(b*br)
  // Scramble trail
  const scrambleChars = "·∘○◎●"
  let trail = ""
  for(let i=0;i<20;i++){
    const dist=i/20, phase=(dist*Math.PI*2+f*0.1)
    const ti = Math.floor((Math.sin(phase)+1)/2*(scrambleChars.length-1))
    const fade = Math.max(30, 200-i*8)
    trail += rgb(Math.floor(r*fade/255),Math.floor(g*fade/255),Math.floor(b*fade/255))+scrambleChars[ti]
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m21 Pi Logo Pulse\x1b[0m\n\n  \x1b[1m${rgb(fr,fg,fb)}${piGlyph}${label}\x1b[0m  ${trail}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
