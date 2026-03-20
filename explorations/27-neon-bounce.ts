// Neon Bounce — A glowing character bouncing between walls with color trail (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const W = 35
const grad = [[255,0,135],[175,95,175],[135,95,215],[95,95,255],[95,175,255],[0,255,255]]
const trailChars = ["█","▓","▒","░","·"," "]
const trail: {pos:number, age:number, color:number[]}[] = []
let f = 0
const render = () => {
  // Bounce position
  const cycle = (f*0.6)%(W*2)
  const pos = Math.floor(cycle<W ? cycle : W*2-cycle)
  // Gradient color based on position
  const t = pos/W
  const gi = Math.floor(t*(grad.length-1))
  const gi2 = Math.min(gi+1,grad.length-1)
  const lt = (t*(grad.length-1))%1
  const r = Math.round(grad[gi][0]+(grad[gi2][0]-grad[gi][0])*lt)
  const g = Math.round(grad[gi][1]+(grad[gi2][1]-grad[gi][1])*lt)
  const b = Math.round(grad[gi][2]+(grad[gi2][2]-grad[gi][2])*lt)
  // Add to trail
  trail.push({pos, age:0, color:[r,g,b]})
  // Render
  const buf = new Array(W).fill("  ") // 2-char-wide slots
  // Trail first (older = dimmer)
  for(const t of trail){
    const fade = Math.max(0, 1 - t.age/5)
    const ci = Math.min(Math.floor(t.age), trailChars.length-1)
    if(ci < trailChars.length-1 && t.pos<W){
      const cr=Math.round(t.color[0]*fade),cg=Math.round(t.color[1]*fade),cb=Math.round(t.color[2]*fade)
      buf[t.pos] = rgb(cr,cg,cb)+trailChars[ci]
    }
    t.age++
  }
  // Head (brightest)
  if(pos<W) buf[pos] = "\x1b[1m"+rgb(Math.min(255,r+50),Math.min(255,g+50),Math.min(255,b+50))+"█\x1b[22m"
  // Cleanup old trail
  while(trail.length>0 && trail[0].age>5) trail.shift()
  // Walls
  const wall = rgb(80,80,100)
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m27 Neon Bounce\x1b[0m\n\n  ${wall}▐${buf.join("")}${wall}▌\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 40)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
