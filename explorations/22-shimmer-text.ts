// Shimmer Text — "Thinking..." with rainbow wave passing through letters (1 line)
const text = "Thinking..."
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
// nicobailon-style gradient ramp
const grad = [
  [255,0,135],[175,95,175],[135,95,215],[95,95,255],[95,175,255],[0,255,255]
]
const baseColor = [200,200,200]
let f = 0
const render = () => {
  let line = ""
  for(let i=0;i<text.length;i++){
    // Wave position
    const wave = Math.sin((i-f*0.3)*0.8)
    if(wave>0.3){
      // Shimmer active — pick gradient color
      const intensity = (wave-0.3)/0.7
      const gi = Math.floor(((i+f*0.5)%(grad.length*2)))
      const gIdx = gi<grad.length?gi:grad.length*2-1-gi // bounce
      const gc = grad[Math.min(gIdx,grad.length-1)]
      const r = Math.round(baseColor[0]+(gc[0]-baseColor[0])*intensity)
      const g = Math.round(baseColor[1]+(gc[1]-baseColor[1])*intensity)
      const b = Math.round(baseColor[2]+(gc[2]-baseColor[2])*intensity)
      line += `\x1b[1m${rgb(r,g,b)}${text[i]}\x1b[22m`
    } else {
      line += rgb(baseColor[0],baseColor[1],baseColor[2])+text[i]
    }
  }
  process.stdout.write(`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m22 Shimmer Text\x1b[0m\n\n  ${line}\x1b[0m\n`)
  f++
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
