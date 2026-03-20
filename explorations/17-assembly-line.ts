// Assembly Line — Icons on a conveyor belt (3 lines: border+belt+border)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const bw = 40
const icons = [
  {ch:"\uf15b",c:rgb(200,200,220)},{ch:"\uf121",c:rgb(100,255,150)},{ch:"\uf013",c:rgb(255,180,80)},
  {ch:"\uf187",c:rgb(180,140,255)},{ch:"\uf135",c:rgb(255,100,80)},{ch:"\uf00c",c:rgb(80,255,180)}
]
const d = rgb(60,60,80)
let f = 0
const render = () => {
  let top = "  "+d+"┌"+"─".repeat(bw)+"┐"
  let belt = "  "+d+"│"
  for(let x=0;x<bw;x++){
    let placed=false
    for(let i=0;i<icons.length;i++){const ip=Math.floor(((f*0.3+i*7)%(bw+4))-2);if(x===ip){belt+=icons[i].c+icons[i].ch;placed=true;break}}
    if(!placed)belt+=d+((x+f)%4===0?"·":"─")
  }
  belt+=d+"│"
  let bot = "  "+d+"└"
  for(let x=0;x<bw;x++) bot+=(x%8===(f%8)?rgb(150,150,170)+"◎":d+"─")
  bot+=d+"┘"
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m17 Assembly Line\x1b[0m\n\n${top}\n${belt}\n${bot}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 80)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
