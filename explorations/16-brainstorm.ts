// Brainstorm — Weather icons escalating with sparkle (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const phases = [
  {icon:"\ue30d",label:"calm",r:255,g:200,b:50},{icon:"\ue302",label:"thinking.",r:180,g:180,b:200},
  {icon:"\ue318",label:"thinking..",r:140,g:140,b:180},{icon:"\ue31d",label:"EUREKA!",r:255,g:255,b:100},
  {icon:"\ue30b",label:"insight!",r:255,g:220,b:100},{icon:"\ue302",label:"processing",r:160,g:160,b:190}
]
let f = 0
const render = () => {
  const pd=35,pos=f%(phases.length*pd),pi=Math.floor(pos/pd),p=phases[pi]
  const glow=Math.sin(f*0.15)*30
  const r=Math.min(255,Math.max(0,p.r+glow)),g=Math.min(255,Math.max(0,p.g+glow)),b=Math.min(255,Math.max(0,p.b+glow))
  // sparkle particles
  let sparks = ""
  for(let i=0;i<20;i++){
    if(Math.random()<0.15){const br=Math.floor(Math.random()*100+155);sparks+=rgb(br,br,Math.min(255,br+50))+(Math.random()<0.3?"⚡":"✦")}
    else sparks+=" "
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m16 Brainstorm\x1b[0m\n\n  ${rgb(r,g,b)}\x1b[1m${p.icon}  ${p.label}\x1b[0m ${sparks}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 80)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
