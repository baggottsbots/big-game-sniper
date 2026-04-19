(function(){
  var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  var W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2);
  function resize(){W=window.innerWidth;H=window.innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);}
  window.addEventListener('resize',resize);resize();
  var state={running:false,score:0,ammo:5,zoom:1,breath:1,holding:false,aimX:0,aimY:0,sway:0,timeLeft:60,animals:[],muzzleFlash:0,recoil:0,hitMarkers:[]};
  var SPECIES=[
    {name:'BOAR',color:'#6b4a2b',size:28,speed:1.6,points:50,rarity:0.30},
    {name:'ELK',color:'#8a6a3a',size:34,speed:1.3,points:80,rarity:0.25},
    {name:'BUFFALO',color:'#3b2e22',size:42,speed:0.9,points:120,rarity:0.18},
    {name:'LION',color:'#c6923d',size:36,speed:1.8,points:150,rarity:0.12},
    {name:'ELEPHANT',color:'#8c8373',size:58,speed:0.6,points:220,rarity:0.10},
    {name:'RHINO',color:'#6d6b66',size:50,speed:0.7,points:300,rarity:0.05}
  ];
  function pickSpecies(){var r=Math.random(),acc=0;for(var i=0;i<SPECIES.length;i++){acc+=SPECIES[i].rarity;if(r<=acc)return SPECIES[i];}return SPECIES[0];}
  function spawnAnimal(){var s=pickSpecies();var fromLeft=Math.random()<0.5;var worldX=fromLeft?-100:W+100;var dir=fromLeft?1:-1;var depth=0.2+Math.random()*0.75;state.animals.push({x:worldX,depth:depth,dir:dir,species:s,alive:true,bob:Math.random()*Math.PI*2,dyingTimer:0});}
  function drawScene(){
    var g=ctx.createLinearGradient(0,0,0,H*0.6);g.addColorStop(0,'#d4c79a');g.addColorStop(1,'#8b7848');ctx.fillStyle=g;ctx.fillRect(0,0,W,H*0.6);
    ctx.fillStyle='#5a4a32';ctx.beginPath();ctx.moveTo(0,H*0.55);
    for(var x=0;x<=W;x+=40){var y=H*0.55-Math.sin(x*0.008)*30-Math.sin(x*0.02)*15;ctx.lineTo(x,y);}
    ctx.lineTo(W,H*0.6);ctx.lineTo(0,H*0.6);ctx.closePath();ctx.fill();
    ctx.fillStyle='#3f5028';ctx.beginPath();ctx.moveTo(0,H*0.62);
    for(var x2=0;x2<=W;x2+=30){var y2=H*0.62-Math.sin(x2*0.015+1)*18;ctx.lineTo(x2,y2);}
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    var gg=ctx.createLinearGradient(0,H*0.62,0,H);gg.addColorStop(0,'#3a5a2b');gg.addColorStop(1,'#1f3216');ctx.fillStyle=gg;ctx.fillRect(0,H*0.62,W,H*0.38);
    ctx.strokeStyle='#2a4019';ctx.lineWidth=1;
    for(var i=0;i<80;i++){var gx=(i*97)%W;var gy=H*0.7+(i%8)*(H*0.04);ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+2,gy-6);ctx.lineTo(gx+4,gy);ctx.stroke();}
    for(var t=0;t<6;t++){var tx=(t*173+40)%W;var baseY=H*0.63+(t%3)*8;ctx.fillStyle='#2a1a0c';ctx.fillRect(tx-3,baseY-30,6,34);ctx.fillStyle='#2e4218';ctx.beginPath();ctx.arc(tx,baseY-34,18,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(tx-12,baseY-28,14,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(tx+12,baseY-28,14,0,Math.PI*2);ctx.fill();}
  }
  function drawAnimal(a){
    var scale=1.2-a.depth*0.9;var size=a.species.size*scale;var groundY=H*0.63+(1-a.depth)*(H*0.30);
    var bobY=Math.sin(a.bob)*2*scale;var x=a.x,y=groundY+bobY-(a.dyingTimer>0?Math.min(a.dyingTimer*4,size*0.3):0);
    ctx.save();ctx.translate(x,y);if(a.dir<0)ctx.scale(-1,1);
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(0,size*0.1,size*0.7,size*0.15,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=a.species.color;var name=a.species.name;
    ctx.beginPath();ctx.ellipse(0,-size*0.3,size*0.7,size*0.35,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(size*0.55,-size*0.45,size*0.28,size*0.22,0,0,Math.PI*2);ctx.fill();
    ctx.fillRect(size*0.3,-size*0.55,size*0.3,size*0.25);
    var legSway=Math.sin(a.bob*2)*size*0.04;
    var legs=[[-0.4,-0.05],[0.35,-0.05],[-0.25,legSway],[0.2,-legSway]];
    for(var l=0;l<legs.length;l++){ctx.fillRect(size*legs[l][0],-size*0.05,size*0.09,size*0.35+legs[l][1]*20);}
    if(name==='ELEPHANT'){
      ctx.strokeStyle=a.species.color;ctx.lineWidth=size*0.12;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(size*0.8,-size*0.42);ctx.quadraticCurveTo(size*1.0,-size*0.2,size*0.9,size*0.05);ctx.stroke();
      ctx.fillStyle='#766e5f';ctx.beginPath();ctx.ellipse(size*0.35,-size*0.55,size*0.18,size*0.22,0.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#eae3c6';ctx.fillRect(size*0.72,-size*0.32,size*0.15,size*0.06);
    } else if(name==='RHINO'){
      ctx.fillStyle='#d9d1b6';ctx.beginPath();ctx.moveTo(size*0.8,-size*0.48);ctx.lineTo(size*0.95,-size*0.7);ctx.lineTo(size*0.72,-size*0.5);ctx.closePath();ctx.fill();
    } else if(name==='LION'){
      ctx.fillStyle='#8a5d22';ctx.beginPath();ctx.arc(size*0.4,-size*0.5,size*0.28,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a3a18';ctx.fillRect(-size*0.8,-size*0.35,size*0.22,size*0.06);
    } else if(name==='ELK'){
      ctx.strokeStyle='#d9c59a';ctx.lineWidth=size*0.06;
      ctx.beginPath();
      ctx.moveTo(size*0.5,-size*0.6);ctx.lineTo(size*0.45,-size*0.85);
      ctx.moveTo(size*0.55,-size*0.6);ctx.lineTo(size*0.65,-size*0.85);
      ctx.moveTo(size*0.45,-size*0.85);ctx.lineTo(size*0.35,-size*0.95);
      ctx.moveTo(size*0.65,-size*0.85);ctx.lineTo(size*0.72,-size*0.95);
      ctx.stroke();
    } else if(name==='BUFFALO'){
      ctx.strokeStyle='#1a1208';ctx.lineWidth=size*0.08;ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(size*0.45,-size*0.6);ctx.quadraticCurveTo(size*0.35,-size*0.75,size*0.5,-size*0.78);
      ctx.moveTo(size*0.65,-size*0.6);ctx.quadraticCurveTo(size*0.8,-size*0.72,size*0.7,-size*0.8);
      ctx.stroke();
    } else if(name==='BOAR'){
      ctx.fillStyle='#e8dbb4';ctx.fillRect(size*0.78,-size*0.4,size*0.08,size*0.04);
    }
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(size*0.62,-size*0.47,size*0.03,0,Math.PI*2);ctx.fill();
    ctx.restore();
    if(state.zoom>1.8&&a.alive){
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x-26,y-size-16,52,14);
      ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.textAlign='center';
      ctx.fillText(a.species.name+' +'+a.species.points,x,y-size-6);
    }
  }
  function drawScope(){
    var cx=state.aimX,cy=state.aimY;
    if(state.zoom>1.2){
      var radius=Math.min(W,H)*0.42;
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.rect(0,0,W,H);ctx.clip('evenodd');
      ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);ctx.restore();
      ctx.strokeStyle='#0a0a0a';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,radius-6,0,Math.PI*2);ctx.stroke();
    }
    ctx.strokeStyle=state.holding?'#ff4f4f':'#ff6b6b';ctx.lineWidth=1.5;
    var s=18;ctx.beginPath();
    ctx.moveTo(cx-s,cy);ctx.lineTo(cx-4,cy);
    ctx.moveTo(cx+4,cy);ctx.lineTo(cx+s,cy);
    ctx.moveTo(cx,cy-s);ctx.lineTo(cx,cy-4);
    ctx.moveTo(cx,cy+4);ctx.lineTo(cx,cy+s);
    ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,2,0,Math.PI*2);ctx.strokeStyle='#ff6b6b';ctx.stroke();
    if(state.zoom>1.2){
      ctx.strokeStyle='rgba(255,107,107,.35)';ctx.lineWidth=1;
      for(var i=1;i<=3;i++){ctx.beginPath();ctx.moveTo(cx-3,cy+i*18);ctx.lineTo(cx+3,cy+i*18);ctx.stroke();}
    }
    var bw=120,bh=6,bx=cx-bw/2,by=cy+60;
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(bx-2,by-2,bw+4,bh+4);
    ctx.fillStyle=state.breath>0.3?'#36D6B5':'#ff5757';ctx.fillRect(bx,by,bw*state.breath,bh);
    if(state.muzzleFlash>0){ctx.fillStyle='rgba(255,230,120,'+state.muzzleFlash+')';ctx.fillRect(0,0,W,H);state.muzzleFlash-=0.15;}
  }
  function drawHitMarkers(){
    state.hitMarkers=state.hitMarkers.filter(function(h){return h.life>0;});
    for(var i=0;i<state.hitMarkers.length;i++){
      var h=state.hitMarkers[i];
      ctx.fillStyle='rgba(255,'+(h.kill?220:80)+','+(h.kill?120:80)+','+h.life+')';
      ctx.font='bold '+(h.kill?22:16)+'px monospace';ctx.textAlign='center';
      ctx.fillText(h.text,h.x,h.y-(1-h.life)*30);
      h.life-=0.015;
    }
  }
  var dragging=false;
  function setAimFromEvent(e){var t=e.touches?e.touches[0]:e;state.aimX=t.clientX;state.aimY=t.clientY;}
  canvas.addEventListener('pointerdown',function(e){dragging=true;setAimFromEvent(e);});
  canvas.addEventListener('pointermove',function(e){if(dragging)setAimFromEvent(e);});
  window.addEventListener('pointerup',function(){dragging=false;});
  canvas.addEventListener('touchstart',function(e){e.preventDefault();dragging=true;setAimFromEvent(e);},{passive:false});
  canvas.addEventListener('touchmove',function(e){e.preventDefault();setAimFromEvent(e);},{passive:false});
  document.getElementById('zoomBtn').addEventListener('click',function(){state.zoom=state.zoom>=3?1:state.zoom+1;document.getElementById('zoom').textContent=state.zoom.toFixed(1)+'x';});
  document.getElementById('holdBtn').addEventListener('pointerdown',function(){state.holding=true;});
  document.getElementById('holdBtn').addEventListener('pointerup',function(){state.holding=false;});
  document.getElementById('holdBtn').addEventListener('pointerleave',function(){state.holding=false;});
  document.getElementById('fireBtn').addEventListener('click',fire);
  window.addEventListener('keydown',function(e){if(!state.running)return;if(e.code==='Space'){e.preventDefault();fire();}if(e.code==='KeyZ'){document.getElementById('zoomBtn').click();}if(e.code==='ShiftLeft'||e.code==='ShiftRight'){state.holding=true;}});
  window.addEventListener('keyup',function(e){if(e.code==='ShiftLeft'||e.code==='ShiftRight'){state.holding=false;}});
  function fire(){
    if(!state.running||state.ammo<=0)return;
    state.ammo--;state.muzzleFlash=0.6;state.recoil=12;
    document.getElementById('ammo').textContent=state.ammo;
    var bestAnimal=null,bestDist=Infinity;
    for(var i=0;i<state.animals.length;i++){
      var a=state.animals[i];if(!a.alive)continue;
      var scale=1.2-a.depth*0.9;var size=a.species.size*scale;
      var groundY=H*0.63+(1-a.depth)*(H*0.30);
      var ax=a.x,ay=groundY-size*0.3;
      var dx=state.aimX-ax,dy=state.aimY-ay;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<size*0.9&&dist<bestDist){bestDist=dist;bestAnimal=a;}
    }
    if(bestAnimal){
      bestAnimal.alive=false;bestAnimal.dyingTimer=60;
      var pts=bestAnimal.species.points;state.score+=pts;
      document.getElementById('score').textContent=state.score;
      state.hitMarkers.push({x:state.aimX,y:state.aimY,text:'+'+pts+' '+bestAnimal.species.name,life:1,kill:true});
      if(pts>=220){state.ammo++;document.getElementById('ammo').textContent=state.ammo;setTimeout(function(){showMsg('TROPHY! +1 AMMO',1000);},100);}
    } else {
      state.hitMarkers.push({x:state.aimX,y:state.aimY,text:'MISS',life:1,kill:false});
    }
  }
  function showMsg(txt,ms){var el=document.getElementById('msg');el.innerHTML=txt;el.style.display='block';if(ms){setTimeout(function(){el.style.display='none';},ms);}}
  var lastSpawn=0,lastTick=performance.now();
  function update(dt){
    if(!state.running)return;
    state.sway+=(state.holding?0.002:0.006)*dt;
    if(state.holding){state.breath-=dt*0.0008;if(state.breath<0){state.breath=0;state.holding=false;}}
    else{state.breath=Math.min(1,state.breath+dt*0.0003);}
    if(state.recoil>0)state.recoil=Math.max(0,state.recoil-dt*0.05);
    lastSpawn+=dt;
    var alive=0;for(var i=0;i<state.animals.length;i++)if(state.animals[i].alive)alive++;
    if(lastSpawn>1400&&alive<4){spawnAnimal();lastSpawn=0;}
    for(var j=0;j<state.animals.length;j++){
      var a=state.animals[j];
      if(a.alive){var scale=1.2-a.depth*0.9;a.x+=a.dir*a.species.speed*scale*(dt*0.06);a.bob+=dt*0.008;}
      else if(a.dyingTimer>0){a.dyingTimer-=dt*0.06;}
    }
    state.animals=state.animals.filter(function(a){if(!a.alive&&a.dyingTimer<=0)return false;if(a.alive&&(a.x<-200||a.x>W+200))return false;return true;});
    state.timeLeft-=dt/1000;
    if(state.timeLeft<=0){state.timeLeft=0;endGame();}
    document.getElementById('timer').textContent=Math.ceil(state.timeLeft);
  }
  function render(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.save();
    var z=state.zoom;
    var rX=(state.recoil?(Math.random()-0.5)*state.recoil:0);
    var rY=state.recoil*0.3;
    ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.translate(-state.aimX+rX,-state.aimY+rY);
    drawScene();
    var sorted=state.animals.slice().sort(function(a,b){return b.depth-a.depth;});
    for(var i=0;i<sorted.length;i++)drawAnimal(sorted[i]);
    ctx.restore();
    var swayX=Math.sin(state.sway)*(state.holding?1.5:6)*(1/state.zoom);
    var swayY=Math.cos(state.sway*1.3)*(state.holding?1:4)*(1/state.zoom);
    var origX=state.aimX,origY=state.aimY;
    state.aimX+=swayX;state.aimY+=swayY;
    drawScope();
    state.aimX=origX;state.aimY=origY;
    drawHitMarkers();
  }
  function loop(t){var dt=Math.min(50,t-lastTick);lastTick=t;update(dt);render();requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
  document.getElementById('startBtn').addEventListener('click',function(){document.getElementById('start').style.display='none';startGame();});
  function startGame(){
    state.running=true;state.score=0;state.ammo=5;state.zoom=1;state.breath=1;state.timeLeft=60;
    state.animals=[];state.hitMarkers=[];state.aimX=W/2;state.aimY=H/2;
    document.getElementById('score').textContent=0;
    document.getElementById('ammo').textContent=5;
    document.getElementById('zoom').textContent='1.0x';
    document.getElementById('timer').textContent=60;
    spawnAnimal();spawnAnimal();
  }
  function endGame(){
    state.running=false;
    var el=document.getElementById('msg');
    var rank='APPRENTICE';
    if(state.score>=1500)rank='LEGENDARY';
    else if(state.score>=1000)rank='MASTER HUNTER';
    else if(state.score>=500)rank='TRACKER';
    else if(state.score>=200)rank='NOVICE';
    el.innerHTML='HUNT OVER<br><br>SCORE: <b style="color:#36D6B5">'+state.score+'</b><br>RANK: '+rank+'<br><small>Tap to hunt again</small>';
    el.style.display='block';el.style.cursor='pointer';
    el.onclick=function(){el.style.display='none';startGame();};
  }
})();