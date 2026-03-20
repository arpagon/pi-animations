// Fire Effect — 3-line demoscene fire
const W = 45, H = 3
const fireChars = " .:-=+*#%@█"
const palette:number[][] = [[0,0,0],[50,0,0],[120,30,0],[200,80,0],[240,160,30],[255,230,120],[255,255,200]]
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
const buf = Array.from({length:H+2},()=>new Float64Array(W))
const render = () => {
  for(let x=0;x<W;x++) buf[H+1][x]=Math.random()>0.35?1:Math.random()*0.5
  for(let y=0;y<H+1;y++) for(let x=0;x<W;x++){
    buf[y][x]=(buf[y+1][(x-1+W)%W]+buf[y+1][x]+buf[y+1][(x+1)%W]+(y+2<H+2?buf[y+2][x]:0))/4.08
  }
  let out=`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m12 Fire Effect\x1b[0m\n\n`
  for(let y=0;y<H;y++){out+="  ";for(let x=0;x<W;x++){
    const v=Math.min(1,Math.max(0,buf[y][x]))
    const pi=Math.floor(v*(palette.length-1)),ci=Math.floor(v*(fireChars.length-1))
    const[r,g,b]=palette[pi];out+=rgb(r,g,b)+fireChars[ci]
  };out+="\n"}
  process.stdout.write(out+"\x1b[0m")
}
const iv = setInterval(render, 50)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
