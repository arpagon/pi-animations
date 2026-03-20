// Orbit Dots — Pulsing dots like typing indicator with pi gradient (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
// pi gradient: magenta → purple → cyan
const grad = [[255,0,135],[175,95,175],[135,95,215],[95,95,255],[95,175,255],[0,255,255]]
const numDots = 5
const dotChars = ["·","∘","○","●","◉","●","○","∘"]
let f = 0
const render = () => {
  let line = ""
  for(let i=0;i<numDots;i++){
    // Each dot has a phase offset — creates wave
    const phase = Math.sin((f*0.12) - i*0.8)
    const norm = (phase+1)/2 // 0..1
    // Pick dot char based on "height"
    const ci = Math.floor(norm*(dotChars.length-1))
    // Pick gradient color based on position + time
    const gi = Math.floor(((i+f*0.1)%grad.length+grad.length)%grad.length)
    const gi2 = (gi+1)%grad.length
    const t = ((i+f*0.1)%1+1)%1
    const gc = grad[gi], gc2 = grad[gi2]
    const r = Math.round(gc[0]+(gc2[0]-gc[0])*t)
    const g = Math.round(gc[1]+(gc2[1]-gc[1])*t)
    const b = Math.round(gc[2]+(gc2[2]-gc[2])*t)
    // Brightness from wave
    const brightness = 0.4+norm*0.6
    const fr=Math.round(r*brightness),fg=Math.round(g*brightness),fb=Math.round(b*brightness)
    line += rgb(fr,fg,fb)+(norm>0.7?"\x1b[1m":"")+dotChars[ci]+"\x1b[22m "
  }
  // Label
  const labelGi = Math.floor((f*0.08)%grad.length)
  const lc = grad[labelGi]
  const ellipsis = [".","..","...",""][Math.floor(f/12)%4]
  line += "  "+rgb(lc[0],lc[1],lc[2])+"Thinking"+rgb(180,180,200)+ellipsis
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m26 Orbit Dots\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
