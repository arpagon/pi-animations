// Pipeline — Animated CI/CD pipeline with nerd icons (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const icons = [
  {i:"\uf0e7",c:rgb(255,200,50)},{i:"\uf013",c:rgb(100,180,255)},
  {i:"\uf121",c:rgb(150,255,150)},{i:"\uf0ad",c:rgb(255,150,100)},{i:"\uf00c",c:rgb(100,255,200)}
]
const pw = 5
let f = 0
const render = () => {
  const total = icons.length*(pw+1)+1
  const pp = (f*0.4)%total
  let line = ""
  for (let i = 0; i < icons.length; i++) {
    const ss = i*(pw+1)
    const active = pp>=ss && pp<ss+pw+1
    line += (active?"\x1b[1m":"\x1b[2m")+icons[i].c+icons[i].i+" \x1b[0m"
    if (i<icons.length-1) for(let p=0;p<pw;p++){const pos=ss+1+p;line+=(Math.abs(pp-pos)<1.5?"\x1b[1m"+rgb(255,255,255)+"═":pp>pos?icons[i].c+"─":rgb(60,60,80)+"─")}
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m08 Pipeline\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 80)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
