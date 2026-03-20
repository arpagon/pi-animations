// Powerline Progress — Wave sweeping with arrows reversing direction (2 lines)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const bg = (r:number,g:number,b:number) => `\x1b[48;2;${r};${g};${b}m`
const sepR = "\ue0b0" // ▶ right
const sepL = "\ue0b2" // ◀ left
const W = 10
const grad = [
  [255,0,135],[220,50,175],[180,80,215],[140,100,255],[100,140,255],
  [60,180,240],[0,200,230],[0,220,210],[0,240,190],[0,255,180]
]
let f = 0
const render = () => {
  const cycle = (f*0.12) % (W*2)
  const goingRight = cycle < W
  const sweepPos = goingRight ? cycle : W*2 - cycle
  const sep = goingRight ? sepR : sepL

  let line1 = ""
  for(let i=0;i<W;i++){
    const gc = grad[goingRight ? i : W-1-i]
    const dist = Math.abs(i - sweepPos)
    const glow = Math.max(0.10, 1 - dist*0.22)
    const r=Math.round(gc[0]*glow),g=Math.round(gc[1]*glow),b=Math.round(gc[2]*glow)
    line1 += bg(r,g,b)+rgb(r,g,b)+"  "
    if(i<W-1){
      const ni = goingRight ? i+1 : W-2-i
      const ngc=grad[Math.abs(ni)%grad.length]
      const nd=Math.abs(i+1-sweepPos),ng=Math.max(0.10,1-nd*0.22)
      const nr=Math.round(ngc[0]*ng),ngg=Math.round(ngc[1]*ng),nb=Math.round(ngc[2]*ng)
      line1 += bg(nr,ngg,nb)+rgb(r,g,b)+sep
    }
  }
  line1 += "\x1b[0m"
  const activeGc = grad[Math.floor(sweepPos)%grad.length]
  const ellipsis = [".","..","...",""][Math.floor(f/10)%4]
  const arrow = goingRight ? "→" : "←"
  const label = rgb(activeGc[0],activeGc[1],activeGc[2])+`  ${arrow} Thinking${ellipsis}`
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m23 Powerline Progress\x1b[0m\n\n  ${line1}\n  ${label}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
