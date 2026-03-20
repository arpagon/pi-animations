// Slot Machine — 3-line spinning icon columns
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const icons = [
  {ch:"\ue796",c:rgb(50,150,255)},{ch:"\ue718",c:rgb(80,200,120)},{ch:"\ue73c",c:rgb(255,200,50)},
  {ch:"\ue7a8",c:rgb(200,100,255)},{ch:"\uf013",c:rgb(255,150,80)},{ch:"\uf121",c:rgb(100,255,180)},
  {ch:"\uf0e7",c:rgb(255,255,100)},{ch:"\uf0ac",c:rgb(100,200,255)}
]
const cols=5, speeds=[0.7,1.0,0.5,0.8,0.6], offsets=[0,3,1,5,2]
let f = 0
const render = () => {
  let out = `\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m09 Slot Machine\x1b[0m\n\n`
  for (let row=0;row<3;row++){
    out+="    "
    for(let col=0;col<cols;col++){
      const idx=Math.floor((f*speeds[col]+offsets[col]+row)%icons.length)
      const ic=icons[idx], br=row===1?"\x1b[1m":"\x1b[2m"
      out+=` ${br}${ic.c}${ic.ch}\x1b[0m `
      if(col<cols-1)out+=rgb(60,60,80)+"│"
    }
    out+="\n"
  }
  process.stdout.write(out+"\x1b[0m")
  f++
}
const iv = setInterval(render, 100)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
