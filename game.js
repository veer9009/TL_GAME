const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
const startScreen=$('#startScreen'), gameOver=$('#gameOver'), paused=$('#paused');
let W,H,dpr,running=false,isPaused=false,last=0,player,items,particles,spawnTimer,distance,coins,speed,lives,level,power,touch,best=0;

function resize(){ dpr=devicePixelRatio||1; W=canvas.clientWidth; H=canvas.clientHeight; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
addEventListener('resize',resize); resize();
function reset(){
  player={lane:0,target:0,y:0,vy:0,invincible:0}; items=[]; particles=[]; distance=coins=0; speed=.04; lives=3; level=1; power={type:null,time:0}; spawnTimer=70;
  $('#coins').textContent='0'; $('#distance').textContent='000'; $('#level').textContent='LEVEL 1'; $('#progress').style.width='0%'; $('#hearts').textContent='♥♥♥'; $('#powerStatus').textContent='';
}
function start(){ reset(); running=true; isPaused=false; startScreen.classList.add('hidden'); gameOver.classList.add('hidden'); paused.classList.add('hidden'); $('#pauseButton').textContent='Ⅱ'; last=performance.now(); requestAnimationFrame(loop); toast('THE TRAIL IS CALM — FIND YOUR RHYTHM'); }
function end(){ running=false; $('#finalDistance').textContent=Math.floor(distance); $('#finalCoins').textContent=coins; $('#endTitle').textContent=distance>260?'Legendary Run!':'Great Run!'; $('#runSummary').textContent=`You reached level ${level} and recovered ${coins} relic${coins===1?'':'s'}.`; gameOver.classList.remove('hidden'); }
function togglePause(){ if(!running)return; isPaused=!isPaused; paused.classList.toggle('hidden',!isPaused); $('#pauseButton').textContent=isPaused?'▶':'Ⅱ'; if(!isPaused){last=performance.now();requestAnimationFrame(loop);} }
function move(n){ if(running&&!isPaused) player.target=Math.max(-1,Math.min(1,player.target+n)); }
function jump(){ if(running&&!isPaused&&player.y<2){player.vy=13; spark(player.lane,'#ead5a4',5);} }
addEventListener('keydown',e=>{ if(e.key==='p'||e.key==='P')togglePause(); if(e.key==='ArrowLeft')move(-1); if(e.key==='ArrowRight')move(1); if(e.key==='ArrowUp'||e.key===' '){e.preventDefault();jump();} });
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>b.dataset.action==='left'?move(-1):b.dataset.action==='right'?move(1):jump());
$('#startButton').onclick=start; $('#restartButton').onclick=start; $('#resumeButton').onclick=togglePause; $('#pauseButton').onclick=togglePause;
canvas.onpointerdown=e=>touch={x:e.clientX,y:e.clientY}; canvas.onpointerup=e=>{ if(!touch)return; const x=e.clientX-touch.x,y=e.clientY-touch.y; if(Math.abs(x)>Math.abs(y)&&Math.abs(x)>25)move(x>0?1:-1); else if(y<-20)jump(); touch=null; };
const lerp=(a,b,t)=>a+(b-a)*t;
function road(z,lane=0){const h=H*.24,p=Math.max(0,z)**1.75;return{x:W/2+lane*W*.84*p*.34,y:h+(H-h)*p,s:.18+p*1.35};}
function spawn(){
  const lane=[-1,0,1][Math.floor(Math.random()*3)], roll=Math.random(); let type=roll<.36?'coin':roll<.62?'rock':roll<.86?'log':'coin';
  items.push({lane,z:.02,type});
  if(type==='coin'&&Math.random()<.6) items.push({lane,z:-.12,type:'coin'});
  if(distance>70&&Math.random()<.11) items.push({lane:[-1,0,1][Math.floor(Math.random()*3)],z:-.08,type:Math.random()<.5?'shield':'magnet'});
}
function update(dt){
  distance+=speed*dt*1.55; const nextLevel=Math.floor(distance/90)+1;
  if(nextLevel>level){level=nextLevel; toast(`LEVEL ${level} — THE PATH QUICKENS`); spark(player.lane,'#ffce52',18);}
  speed=Math.min(.085,.04+(level-1)*.006); $('#distance').textContent=String(Math.floor(distance)).padStart(3,'0'); $('#level').textContent=`LEVEL ${level}`; $('#progress').style.width=`${distance%90/90*100}%`;
  spawnTimer-=dt; if(spawnTimer<=0){spawn(); spawnTimer=Math.max(44,96-level*7+Math.random()*38);}
  player.lane=lerp(player.lane,player.target,.16*dt); player.vy-=.76*dt; player.y+=player.vy*dt; if(player.y<0){player.y=0;player.vy=0;} player.invincible=Math.max(0,player.invincible-dt);
  if(power.time>0){power.time-=dt;if(power.time<=0){power={type:null,time:0};$('#powerStatus').textContent='';}}
  items.forEach(o=>{o.z+=speed*dt; if(power.type==='magnet'&&o.type==='coin'&&o.z>.35) o.lane=lerp(o.lane,player.lane,.06*dt);
    if(!o.hit&&o.z>.79&&o.z<1.09&&Math.abs(player.lane-o.lane)<.34){
      if(o.type==='coin'){collect(o);}
      else if(o.type==='shield'||o.type==='magnet'){activate(o.type);o.hit=true;spark(o.lane,o.type==='shield'?'#73dbe4':'#d98cff',16);}
      else if((o.type==='log'&&player.y<18)||(o.type==='rock'&&player.y<7)) hit(o);
    }
  }); items=items.filter(o=>o.z<1.2&&!o.hit); particles=particles.filter(p=>(p.life-=dt)>0);
}
function collect(o){o.hit=true;coins++;$('#coins').textContent=coins;spark(o.lane,'#ffe485',9); if(coins%12===0)toast('RELIC SET FOUND — KEEP EXPLORING');}
function activate(type){power={type,time:330}; $('#powerStatus').textContent=type==='shield'?'◈ SHIELD':'✦ MAGNET'; toast(type==='shield'?'ANCIENT SHIELD ACTIVE':'RELIC MAGNET ACTIVE');}
function hit(o){ if(player.invincible>0)return; o.hit=true; if(power.type==='shield'){power={type:null,time:0};$('#powerStatus').textContent='';toast('SHIELD BROKEN — YOU ARE SAFE');spark(player.lane,'#78e0e4',22);return;} lives--;player.invincible=85;$('#hearts').textContent='♥'.repeat(lives)+'♡'.repeat(3-lives);spark(player.lane,'#ef7152',22); if(!lives)end();else toast('WATCH THE TRAIL — ONE HEART LOST'); }
function spark(lane,color,count){const a=road(.82,lane); for(let i=0;i<count;i++)particles.push({x:a.x,y:a.y,dx:(Math.random()-.5)*8,dy:(Math.random()-.5)*8,life:18+Math.random()*15,color});}
let toastTimer; function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1900);}
function loop(now){if(!running||isPaused)return;const dt=Math.min(32,now-last)/16.67;last=now;update(dt);draw();requestAnimationFrame(loop);}
function draw(){
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#7db3a0');sky.addColorStop(.33,'#c9ba7d');sky.addColorStop(.34,'#6c9b69');sky.addColorStop(1,'#173d32');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#225b45';for(let i=0;i<19;i++){const x=i*W/18-20,h=28+Math.sin(i*8)*20;ctx.beginPath();ctx.arc(x,H*.3,h,Math.PI,0);ctx.fill();}ctx.fillStyle='#123d31';for(let i=0;i<15;i++){ctx.beginPath();ctx.arc(i*W/14-35,H*.38,35+i%3*16,Math.PI,0);ctx.fill();}
  const t=road(0),l=road(1,-1.6),r=road(1,1.6);ctx.fillStyle='#b8915a';ctx.beginPath();ctx.moveTo(t.x-16,t.y);ctx.lineTo(r.x,r.y);ctx.lineTo(l.x,l.y);ctx.fill();
  for(let z=.05;z<1;z+=.09){const a=road(z),b=road(z+.018);ctx.fillStyle='#846a43';ctx.fillRect(a.x-(b.y-a.y)*3.5,a.y,(b.y-a.y)*7,b.y-a.y+1);}ctx.strokeStyle='#d7bd78';ctx.lineWidth=2;[-.5,.5].forEach(n=>{ctx.beginPath();for(let z=0;z<=1;z+=.05){const p=road(z,n);z?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.stroke();}); trees();items.sort((a,b)=>a.z-b.z).forEach(item);runner();particles.forEach(p=>{ctx.fillStyle=p.color;ctx.fillRect(p.x+p.dx*(30-p.life)/4,p.y+p.dy*(30-p.life)/4,3,3);});
}
function trees(){ctx.fillStyle='#16382b';for(const n of[-1,1])for(let i=0;i<6;i++){const p=road(.18+i*.16,n*2.1),s=p.s*35;ctx.fillRect(p.x-s*.16,p.y-s*1.2,s*.32,s*1.4);ctx.beginPath();ctx.arc(p.x,p.y-s*1.25,s*.75,0,7);ctx.fill();}}
function item(o){const p=road(o.z,o.lane),s=p.s*36;ctx.save();ctx.translate(p.x,p.y); if(o.type==='coin'){ctx.fillStyle='#ffcf4f';ctx.beginPath();ctx.ellipse(0,-s*.7,s*.33,s*.43,0,0,7);ctx.fill();ctx.strokeStyle='#fff0a1';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#a96420';ctx.font=`${s*.45}px sans-serif`;ctx.textAlign='center';ctx.fillText('◆',0,-s*.54);} else if(o.type==='rock'){ctx.fillStyle='#574d42';ctx.beginPath();ctx.moveTo(-s*.7,0);ctx.lineTo(-s*.43,-s*.75);ctx.lineTo(s*.45,-s*.72);ctx.lineTo(s*.75,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#292722';ctx.stroke();} else if(o.type==='log'){ctx.fillStyle='#694128';ctx.fillRect(-s*.82,-s*.38,s*1.64,s*.42);ctx.fillStyle='#d29a52';ctx.beginPath();ctx.arc(-s*.77,-s*.17,s*.21,0,7);ctx.fill();}else{ctx.fillStyle=o.type==='shield'?'#67dbe5':'#d68cff';ctx.beginPath();ctx.arc(0,-s*.62,s*.45,0,7);ctx.fill();ctx.strokeStyle='#fff5c5';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font=`${s*.43}px sans-serif`;ctx.textAlign='center';ctx.fillText(o.type==='shield'?'◈':'✦',0,-s*.47);}ctx.restore();}
function runner(){
  const p=road(.91,player.lane),s=p.s*29,airborne=player.y>1;
  const phase=distance*.62,step=Math.sin(phase)*s*.27,bob=airborne?0:Math.abs(Math.cos(phase))*s*.045;
  const y=p.y-player.y*s*.085-bob,lean=(player.target-player.lane)*.18;
  ctx.save();ctx.translate(p.x,y);
  ctx.fillStyle='rgba(25,30,23,.28)';ctx.beginPath();ctx.ellipse(0,s*.04,s*.62,s*.13,0,0,Math.PI*2);ctx.fill();
  ctx.rotate(lean);
  if(player.invincible>0&&Math.floor(player.invincible/6)%2===0)ctx.globalAlpha=.35;
  const limb=(x1,y1,x2,y2,x3,y3,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.stroke();};
  // Rear limbs first create a more convincing running stride.
  limb(s*.18,-s*.47,s*.25,-s*.15,s*.22+step*.28,0,'#35251e',s*.16);
  limb(-s*.18,-s*.47,-s*.25,-s*.15,-s*.22-step*.28,0,'#35251e',s*.16);
  limb(s*.24,-s*1.12,s*.48+step*.15,-s*.82,s*.38+step*.18,-s*.56,'#e1a15d',s*.12);
  ctx.fillStyle='#c84e2c';ctx.beginPath();ctx.moveTo(-s*.33,-s*1.48);ctx.lineTo(s*.33,-s*1.48);ctx.lineTo(s*.4,-s*.48);ctx.lineTo(-s*.4,-s*.48);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e1a15d';ctx.fillRect(-s*.24,-s*1.43,s*.48,s*.34);
  limb(-s*.24,-s*1.12,-s*.48-step*.15,-s*.83,-s*.38-step*.18,-s*.56,'#e1a15d',s*.12);
  limb(-s*.18,-s*.47,-s*.25,-s*.15,-s*.22-step*.28,0,'#2d211b',s*.16);
  limb(s*.18,-s*.47,s*.25,-s*.15,s*.22+step*.28,0,'#2d211b',s*.16);
  ctx.fillStyle='#e1a15d';ctx.beginPath();ctx.ellipse(0,-s*1.72,s*.31,s*.37,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#472d22';ctx.beginPath();ctx.arc(0,-s*1.82,s*.32,Math.PI,Math.PI*2);ctx.fill();
  if(power.type==='shield'){ctx.strokeStyle='#82eff0';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-s*.94,s*.72,s*1.05,0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
