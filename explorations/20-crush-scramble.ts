// Crush Scramble — Reimpl of Crush's animated scrambler with gradient (1 line)
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const scramble = "0123456789abcdefABCDEF~!@#$£€%^&*()+=_"
const label = "Thinking", sw = 15, ellipsis = [".","..","...",""]
const ramp:number[][] = []
for(let i=0;i<sw+label.length+1;i++){
  const t=i/(sw+label.length),a=t*Math.PI*2
  ramp.push([Math.round(Math.sin(a)*127+128),Math.round(Math.sin(a+2.094)*80+80),Math.round(Math.sin(a+4.189)*127+128)])
}
const births = Array.from({length:sw},()=>Math.random()*20)
let f = 0
const render = () => {
  const init = f>20
  let line = ""
  for(let i=0;i<sw;i++){
    const ci=(i+(init?f:0))%ramp.length, [r,g,b]=ramp[ci]
    if(!init&&f<births[i]) line+=rgb(r,g,b)+"."
    else line+=rgb(r,g,b)+scramble[Math.floor(Math.random()*scramble.length)]
  }
  line+=" "+rgb(200,200,200)+label
  if(init) line+=rgb(200,200,200)+ellipsis[Math.floor(f/8)%ellipsis.length]
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m20 Crush Scramble\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
