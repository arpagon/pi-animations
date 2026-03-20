// Dev Constellation — Dev icons with traveling pulses between them (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const nodes = [
  {ch:"\ue796",c:rgb(50,150,255)},{ch:"\ue718",c:rgb(80,200,120)},{ch:"\ue73c",c:rgb(255,200,50)},
  {ch:"\ue7a8",c:rgb(200,100,255)},{ch:"\uf13b",c:rgb(100,200,255)},{ch:"\ue61e",c:rgb(255,100,100)}
]
const gap = 5
let f = 0
const render = () => {
  const totalW = nodes.length*(gap+1)-1
  const pulsePos = (f*0.4)%totalW
  let line = ""
  for(let i=0;i<nodes.length;i++){
    const nodePos = i*(gap+1)
    // Node icon with glow if pulse is near
    const dist = Math.abs(pulsePos-nodePos)
    if(dist<1.5) line+="\x1b[1m"+nodes[i].c+nodes[i].ch+"\x1b[22m"
    else line+="\x1b[2m"+nodes[i].c+nodes[i].ch+"\x1b[22m"
    // Connection
    if(i<nodes.length-1){
      for(let g=0;g<gap;g++){
        const connPos=nodePos+1+g
        const cd=Math.abs(pulsePos-connPos)
        if(cd<1) line+="\x1b[1m"+rgb(255,255,255)+"━"
        else if(cd<2.5) line+=rgb(150,150,200)+"─"
        else line+=rgb(40,40,55)+"·"
      }
    }
  }
  // Twinkle
  let tw="  "
  for(let i=0;i<5;i++) tw+=Math.random()<0.3?rgb(100+Math.floor(Math.random()*155),100+Math.floor(Math.random()*155),150)+"✦":"  "
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m19 Dev Constellation\x1b[0m\n\n  ${line}${tw}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 70)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
