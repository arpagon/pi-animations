// Starfield — Horizontal parallax stars (1 line)
const W = 55
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
type Star = {x:number; speed:number; bright:number; ch:string}
const starChars = ["·","∙","•","✦","★"]
const stars:Star[] = Array.from({length:30},()=>{
  const speed = 0.2+Math.random()*1.2
  const layer = Math.floor(speed/0.3)
  return {x:Math.random()*W, speed, bright:Math.min(255,80+layer*40), ch:starChars[Math.min(layer,starChars.length-1)]}
})
let f = 0
const render = () => {
  const buf = new Array(W).fill(" ")
  for(const s of stars){
    const xi = Math.floor(s.x)
    if(xi>=0&&xi<W) buf[xi]=rgb(s.bright,s.bright,Math.min(255,s.bright+40))+s.ch
    s.x+=s.speed; if(s.x>=W){s.x=0;s.speed=0.2+Math.random()*1.2;const layer=Math.floor(s.speed/0.3);s.bright=Math.min(255,80+layer*40);s.ch=starChars[Math.min(layer,starChars.length-1)]}
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m10 Starfield\x1b[0m\n\n  ${buf.join("")}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
