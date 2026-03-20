// Icon Morphing — Cycling nerd icons with sparkle trail (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const icons = [
  {ch:"\uf0eb",r:255,g:220,b:50},{ch:"\uf013",r:100,g:180,b:255},{ch:"\uf0e7",r:255,g:150,b:50},
  {ch:"\uf135",r:255,g:100,b:100},{ch:"\uf005",r:255,g:255,b:100},{ch:"\uf06d",r:255,g:120,b:30},
  {ch:"\uf0ac",r:100,g:200,b:255},{ch:"\uf004",r:255,g:80,b:120}
]
const trans = "░▒▓█▓▒░"
let f = 0
const render = () => {
  const cd=25,tot=icons.length*cd,pos=f%tot
  const ci=Math.floor(pos/cd),ni=(ci+1)%icons.length,p=(pos%cd)/cd
  const cur=icons[ci],nxt=icons[ni]
  const r=Math.round(cur.r+(nxt.r-cur.r)*p),g=Math.round(cur.g+(nxt.g-cur.g)*p),b=Math.round(cur.b+(nxt.b-cur.b)*p)
  let display:string
  if(p<0.3)display=rgb(r,g,b)+cur.ch
  else if(p<0.7){const ti=Math.floor((p-0.3)/0.4*trans.length);display=rgb(r,g,b)+trans[Math.min(ti,trans.length-1)]}
  else display=rgb(r,g,b)+nxt.ch
  let trail=""
  for(let i=0;i<25;i++){const sp=Math.random()<0.25?(Math.random()<0.5?"✦":"·"):" ";const br=Math.floor(Math.random()*155+100);trail+=rgb(br,br,Math.floor(br*0.8))+sp}
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m15 Icon Morphing\x1b[0m\n\n  ${display}  ${trail}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 60)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
