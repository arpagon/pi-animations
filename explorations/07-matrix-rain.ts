// Matrix Rain — 3-line compact rain
const W = 50, H = 3
const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘ012789Z"
const rgb = (r:number,g:number,b:number) => `\x1b[38;2;${r};${g};${b}m`
type Drop = {x:number;y:number;speed:number;len:number}
const drops:Drop[] = Array.from({length:20},()=>({x:Math.floor(Math.random()*W),y:Math.random()*-H,speed:0.2+Math.random()*0.4,len:2+Math.floor(Math.random()*2)}))
const render = () => {
  const grid:string[][]=Array.from({length:H},()=>Array(W).fill(" "))
  for(const d of drops){
    const hy=Math.floor(d.y)
    for(let t=0;t<d.len;t++){const cy=hy-t;if(cy>=0&&cy<H&&d.x<W){const b=t===0?255:Math.max(40,160-t*50);grid[cy][d.x]=rgb(0,b,t===0?b:30)+chars[Math.floor(Math.random()*chars.length)]}}
    d.y+=d.speed;if(d.y-d.len>H){d.y=Math.random()*-3;d.x=Math.floor(Math.random()*W)}
  }
  let out=`\x1b[2J\x1b[H\x1b[?25l\n  \x1b[1;37m07 Matrix Rain\x1b[0m\n\n`
  for(const row of grid)out+="  "+row.join("")+"\x1b[0m\n"
  process.stdout.write(out)
}
const iv = setInterval(render, 60)
process.on("SIGINT", () => { clearInterval(iv); process.stdout.write("\x1b[?25h\x1b[0m\n"); process.exit() })
