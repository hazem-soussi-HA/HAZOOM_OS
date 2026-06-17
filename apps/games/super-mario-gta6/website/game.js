(window._gameErrors = [];
window.addEventListener('error', function(e) { window._gameErrors.push(e.message + ' at ' + e.filename + ':' + e.lineno); });
 try {
function() {
/ ═══════════════════════════════════════════════════════════════
// SUPER MARIO GTA6 — V1.2 "World Tour" Nano Engine
// Koopas, Power-ups, Fireballs, BGM, Combos, Breakable Bricks,
// Hidden Blocks, Mobile Controls, Screen Shake, Score Popups
// Original: mario_gta6_2d.py (418 lines) by Hazem Soussi (HA)
// ═══════════════════════════════════════════════════════════════
(function() {
  "use strict";
  var TILE=48, WW=250, WH=16;
  var GRAV=2200, JVEL=-680, SHOP=-420, MFALL=900;
  var WALK=220, RUN=380, AG=35, AY=22, DG=28, DA=15;
  var JBUF=0.12, JHOLD=0.15, COYOTE=0.10;
  var SKY=[92,148,252];
  var RED="#c81e1e",SKN="#f8b878",BRN="#804000",BLU="#1e3cc8";
  var GRN="#00a800",YLW="#ffdc00",GRD="#c84c0c",BRC="#b82818";
  var BLK2="#e4a020",GOM="#a46424",WHT="#ffffff",BLK="#000000";
  var PIP="#00a800",PI2="#007800",PIL="#64dc64";
  var KOOPA_GREEN="#2d8a4e",KOOPA_DARK="#1a5c30",KOOPA_SKIN="#f8d878";
  var STAR_YLW="#ffe040";

  var canvas=document.getElementById('game-canvas');
  var ctx=canvas.getContext('2d');
  var W,H;
  function resizeCanvas(){
    var c=canvas.parentElement,cw=c.clientWidth,ch=c.clientHeight;
    if(cw/ch>16/9){H=ch;W=Math.floor(ch*16/9);}else{W=cw;H=Math.floor(cw/(16/9));}
    canvas.width=W;canvas.height=H;
  }

  // ═══ AUDIO ═══
  var AudioCtx=window.AudioContext||window.webkitAudioContext;
  var audioCtx=null,audioEnabled=false;
  function initAudio(){
    if(!audioCtx){audioCtx=new AudioCtx();audioEnabled=true;}
    if(audioCtx.state==='suspended')audioCtx.resume();
  }
  function playTone(freq,dur,type,vol){
    if(!audioEnabled||!audioCtx)return;
    try{
      var o=audioCtx.createOscillator(),g=audioCtx.createGain();
      o.type=type||'square';o.frequency.setValueAtTime(freq,audioCtx.currentTime);
      g.gain.setValueAtTime(vol||0.08,audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
      o.connect(g);g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime);o.stop(audioCtx.currentTime+dur);
    }catch(e){}
  }
  function playNotes(notes,tempo){
    if(!audioEnabled)return;
    notes.forEach(function(n,i){
      setTimeout(function(){if(n.f)playTone(n.f,n.d||0.1,n.type||'square',n.v||0.04);},i*tempo);
    });
  }
  var SFX={
    jump:function(){playTone(400,0.12,'square',0.06);setTimeout(function(){playTone(600,0.08,'square',0.04);},40);},
    coin:function(){playTone(988,0.08,'square',0.05);setTimeout(function(){playTone(1319,0.15,'square',0.05);},80);},
    stomp:function(){playTone(150,0.12,'sawtooth',0.06);},
    koopaStomp:function(){playTone(120,0.1,'sawtooth',0.05);setTimeout(function(){playTone(180,0.08,'sawtooth',0.04);},50);},
    shellKick:function(){playTone(200,0.06,'sawtooth',0.05);},
    shellBounce:function(){playTone(300,0.05,'sawtooth',0.04);setTimeout(function(){playTone(400,0.05,'sawtooth',0.03);},30);},
    mushroom:function(){playNotes([{f:262},{f:330},{f:392},{f:523}],80);},
    fireball:function(){playTone(600,0.05,'sawtooth',0.04);playTone(400,0.05,'sawtooth',0.03);},
    star:function(){var f=523;[0,1,2,3,4,5,6,7].forEach(function(i){setTimeout(function(){playTone(f+i*40,0.08,'square',0.03);},i*50);});},
    die:function(){playNotes([{f:523},{f:494},{f:440},{f:392},{f:349},{f:330},{f:262}],180);},
    hurt:function(){playNotes([{f:200},{f:150}],120);},
    breakBrick:function(){playTone(180,0.1,'sawtooth',0.05);},
    combo:function(v){playTone(600+v*50,0.05,'square',0.03);},
    start:function(){playNotes([{f:523},{f:659},{f:784},{f:1047}],100);},
    enterCar:function(){playTone(300,0.1,'triangle',0.05);playTone(500,0.1,'triangle',0.05);},
    powerDown:function(){playNotes([{f:400},{f:300},{f:200}],100);}
  };

  // ═══ BGM ═══
  var bgmInterval=null,bgmPlaying=false,bgmStep=0;
  var bgmMelody=[
    {f:659,d:0.12},{f:659,d:0.12},{f:0,d:0.12},{f:659,d:0.12},{f:0,d:0.12},{f:523,d:0.12},{f:659,d:0.24},
    {f:784,d:0.24},{f:0,d:0.24},{f:392,d:0.24},{f:0,d:0.12},{f:523,d:0.24},{f:0,d:0.12},{f:392,d:0.24},{f:0,d:0.12},{f:330,d:0.24},
    {f:440,d:0.12},{f:494,d:0.12},{f:466,d:0.12},{f:440,d:0.12},{f:392,d:0.18},{f:659,d:0.18},{f:784,d:0.18},{f:880,d:0.18},
    {f:698,d:0.12},{f:784,d:0.12},{f:0,d:0.12},{f:659,d:0.12},{f:0,d:0.12},{f:523,d:0.12},{f:587,d:0.12},{f:494,d:0.12},
    {f:523,d:0.24},{f:0,d:0.12},{f:392,d:0.24},{f:0,d:0.12},{f:330,d:0.24},{f:0,d:0.12},{f:440,d:0.24},
    {f:494,d:0.12},{f:466,d:0.12},{f:440,d:0.12},{f:392,d:0.18},{f:659,d:0.18},{f:784,d:0.18},{f:880,d:0.18},
    {f:698,d:0.12},{f:784,d:0.12},{f:0,d:0.12},{f:659,d:0.12},{f:0,d:0.12},{f:523,d:0.12},{f:587,d:0.12},{f:494,d:0.12}
  ];
  function startBGM(){
    if(bgmPlaying)return;bgmPlaying=true;
    bgmInterval=setInterval(function(){
      if(!audioEnabled||!audioCtx)return;
      var n=bgmMelody[bgmStep%bgmMelody.length];
      if(n.f)playTone(n.f,n.d*0.9,'square',0.025);
      var bassNote=[262,196,165,196][Math.floor(bgmStep/4)%4];
      if(bgmStep%2===0)playTone(bassNote,n.d*0.9,'triangle',0.02);
      bgmStep++;
    },125);
  }
  function stopBGM(){if(bgmInterval){clearInterval(bgmInterval);bgmInterval=null;}bgmPlaying=false;}

  // ═══ TILE CACHE ═══
  var tileCanvases={};
  function renderTile(key){
    var t=document.createElement('canvas');t.width=TILE;t.height=TILE;
    var tc=t.getContext('2d');
    if(key===1){// Ground with grass and dirt texture
      tc.fillStyle=GRD;tc.fillRect(0,0,TILE,TILE);
      // Grass top with variation
      tc.fillStyle='#009900';tc.fillRect(0,0,TILE,8);
      tc.fillStyle='#007800';tc.fillRect(0,6,TILE,4);
      // Grass blades
      for(var i=0;i<8;i++){tc.fillStyle=i%2===0?'#00aa00':'#008800';tc.fillRect(i*6,0,3,10);}
      // Dirt texture
      tc.fillStyle='#a05808';tc.fillRect(8,16,16,12);tc.fillRect(28,20,10,8);tc.fillRect(6,28,14,10);
      tc.fillStyle='#b06818';tc.fillRect(10,18,4,4);tc.fillRect(30,22,3,3);
      tc.fillStyle='#8a4008';tc.fillRect(16,24,8,6);
      // Dirt grains
      tc.fillStyle='#c07828';
      tc.fillRect(4,22,2,2);tc.fillRect(22,18,2,2);tc.fillRect(38,26,2,2);tc.fillRect(14,32,2,2);
      // Moss spots
      tc.fillStyle='#4a8a2a';tc.fillRect(2,8,4,3);tc.fillRect(36,10,3,2);
    }
    else if(key===2){// Brick with mortar and highlight
      tc.fillStyle=BRC;tc.fillRect(0,0,TILE,TILE);
      // Mortar lines
      tc.strokeStyle='#881c10';tc.lineWidth=2;
      for(var i=0;i<4;i++){tc.beginPath();tc.moveTo(0,i*12+12);tc.lineTo(TILE,i*12+12);tc.stroke();}
      tc.beginPath();tc.moveTo(TILE/2,0);tc.lineTo(TILE/2,TILE);tc.stroke();
      // Brick highlights (top-left edges)
      tc.fillStyle='rgba(255,120,60,0.2)';
      for(var j=0;j<4;j++){tc.fillRect(0,j*12+12,TILE/2,2);tc.fillRect(TILE/2,j*12+12,TILE/2,1);}
      tc.fillStyle='rgba(0,0,0,0.12)';
      for(var k=0;k<4;k++){tc.fillRect(0,j*12+10+TILE/2,TILE/2,2);}
      // Brick texture dots
      tc.fillStyle='#a02010';
      tc.fillRect(6,18,2,2);tc.fillRect(20,6,2,2);tc.fillRect(34,30,2,2);tc.fillRect(14,42,2,2);
    }
    else if(key===3){// Question block with shine animation feel
      tc.fillStyle=BLK2;tc.fillRect(0,0,TILE,TILE);
      tc.strokeStyle='#b48020';tc.lineWidth=3;tc.strokeRect(2,2,TILE-4,TILE-4);
      // Inner shadow
      tc.fillStyle='rgba(0,0,0,0.1)';tc.fillRect(3,3,TILE-6,2);tc.fillRect(3,3,2,TILE-6);
      // Question mark with depth
      tc.fillStyle='#aa8800';tc.font='bold 22px Arial';tc.textAlign='center';tc.textBaseline='middle';tc.fillText('?',TILE/2+1,TILE/2+3);
      tc.fillStyle=YLW;tc.fillText('?',TILE/2,TILE/2+1);
      // ? shine
      tc.fillStyle='rgba(255,255,200,0.4)';tc.fillRect(TILE/2-4,TILE/2-6,3,2);
      // Corner bolts with depth
      tc.fillStyle='#8a6810';tc.beginPath();tc.arc(5,5,3,0,Math.PI*2);tc.fill();tc.beginPath();tc.arc(TILE-5,5,3,0,Math.PI*2).fill();
      tc.beginPath();tc.arc(5,TILE-5,3,0,Math.PI*2).fill();tc.beginPath();tc.arc(TILE-5,TILE-5,3,0,Math.PI*2).fill();
      tc.fillStyle='#dac820';
      tc.beginPath();tc.arc(4,4,1.5,0,Math.PI*2).fill();tc.beginPath();tc.arc(TILE-6,4,1.5,0,Math.PI*2).fill();
      tc.beginPath();tc.arc(4,TILE-6,1.5,0,Math.PI*2).fill();tc.beginPath();tc.arc(TILE-6,TILE-6,1.5,0,Math.PI*2).fill();
    }
    else if(key===8){// Hidden block (!)
      tc.fillStyle='#8B6914';tc.fillRect(0,0,TILE,TILE);tc.strokeStyle='#6B4E0A';tc.lineWidth=3;tc.strokeRect(2,2,TILE-4,TILE-4);
      tc.fillStyle='#6B4E0A';tc.font='bold 20px Arial';tc.textAlign='center';tc.textBaseline='middle';tc.fillText('!',TILE/2+1,TILE/2+3);
      tc.fillStyle='#ffdc00';tc.fillText('!',TILE/2,TILE/2+1);
      tc.fillStyle='rgba(255,255,200,0.3)';tc.fillRect(TILE/2-3,TILE/2-7,2,2);
    }
    else if(key===9){// Empty/hard block with scratches
      tc.fillStyle='#8c6414';tc.fillRect(0,0,TILE,TILE);
      tc.fillStyle='rgba(0,0,0,0.12)';tc.fillRect(0,0,TILE,4);
      // Scratch marks
      tc.strokeStyle='rgba(0,0,0,0.15)';tc.lineWidth=1;
      tc.beginPath();tc.moveTo(8,20);tc.lineTo(28,18);tc.stroke();
      tc.beginPath();tc.moveTo(14,36);tc.lineTo(38,34);tc.stroke();
      // Highlight
      tc.fillStyle='rgba(255,255,255,0.06)';tc.fillRect(0,0,TILE,2);tc.fillRect(0,0,2,TILE);
    }
    else if(key===10){// Dark/underground block
      tc.fillStyle='#3a3a4a';tc.fillRect(0,0,TILE,TILE);
      tc.fillStyle='#2a2a3a';tc.fillRect(0,0,TILE,4);
      tc.fillStyle='#4a4a5a';tc.fillRect(TILE-4,0,4,TILE);
      // Cracks
      tc.strokeStyle='rgba(0,0,0,0.2)';tc.lineWidth=1;
      tc.beginPath();tc.moveTo(10,10);tc.lineTo(30,15);tc.lineTo(40,8);tc.stroke();
      tc.beginPath();tc.moveTo(5,35);tc.lineTo(25,38);tc.stroke();
      // Moss
      tc.fillStyle='rgba(50,100,50,0.15)';tc.fillRect(2,0,6,4);tc.fillRect(36,0,8,3);
    }
    return t;
  }
  [1,2,3,8,9,10].forEach(function(k){tileCanvases[k]=renderTile(k);});


  function renderPipe(top,color){
    var key=(top?'pipe_top_':'pipe_body_')+(color||'green');
    if(tileCanvases[key])return tileCanvases[key];
    var t=document.createElement('canvas');t.width=TILE;t.height=TILE;
    var tc=t.getContext('2d');
    var c1=color==='dark'?'#006800':PIL,c2=PIP,c3=color==='dark'?'#004000':PI2;
    if(top){tc.fillStyle=c2;tc.fillRect(0,0,TILE,TILE);tc.fillStyle=c1;tc.fillRect(0,0,Math.floor(TILE/6),TILE);tc.fillStyle=c3;tc.fillRect(TILE-Math.floor(TILE/6),0,Math.floor(TILE/6),TILE);tc.strokeStyle='#004000';tc.lineWidth=2;tc.strokeRect(1,1,TILE-2,TILE-2);tc.fillStyle='rgba(255,255,255,0.12)';tc.fillRect(4,2,8,TILE-4);}
    else{tc.fillStyle=c2;tc.fillRect(TILE*0.1,0,TILE*0.8,TILE);tc.fillStyle=c1;tc.fillRect(TILE*0.1,0,Math.floor(TILE/8),TILE);tc.fillStyle=c3;tc.fillRect(TILE-TILE*0.1-Math.floor(TILE/8),0,Math.floor(TILE/8),TILE);tc.strokeStyle='#004000';tc.lineWidth=2;tc.strokeRect(TILE*0.1,1,TILE*0.8-1,TILE-2);tc.fillStyle='rgba(255,255,255,0.08)';tc.fillRect(TILE*0.15,2,6,TILE-4);}
    tileCanvases[key]=t;return t;
  }

  // ═══ HIGH-QUALITY MARIO SPRITES ═══
  var marioCache={};
  function drawMarioSprite(big,fire,pose) {
    var key=(big?1:0)+'_'+(fire?1:0)+'_'+pose;
    if(marioCache[key]) return marioCache[key];
    var w=64, h=big?128:96;
    var t=document.createElement('canvas');t.width=w;t.height=h;
    var c=t.getContext('2d');
    var fC=fire;
    var cap=fC?'#ffffff':'#dd0000',capB=fC?'#ffcccc':'#ff2222',capS=fC?'#cc9999':'#aa0000';
    var skin=SKN,skinS='#d4a060';
    var body=fC?'#ffffff':'#1e3cc8',bodyB=fC?'#eeeeee':'#3355dd',bodyS=fC?'#bbbbbb':'#112288';
    var shoe='#553311',shoeB='#774422',shoeS='#332200';
    if(fC){shoe='#ffffff';shoeB='#dddddd';shoeS='#999999';}
    var rect2=function(x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));};
    var dot2=function(x,y,rad,col){c.fillStyle=col;c.beginPath();c.arc(Math.floor(x),Math.floor(y),Math.ceil(rad),0,Math.PI*2);c.fill();};
    
    if(!big){
      // Small Mario head
      dot2(32,14,12,skin);
      c.fillStyle=cap;c.beginPath();c.ellipse(32,10,14,10,0,Math.PI*2);c.fill();
      dot2(32,6,8,capB);
      c.fillStyle=capS;c.beginPath();c.ellipse(32,16,16,4,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,255,255,0.2)';c.beginPath();c.ellipse(28,5,4,3,0,Math.PI*2);c.fill();
      c.fillStyle='#333';dot2(28,13,3);dot2(36,13,3);
      c.fillStyle=WHT;dot2(27,12,1.5);dot2(35,12,1.5);
      c.fillStyle=BLK;dot2(28,13,1.5);dot2(36,13,1.5);
      dot2(32,17,4,skin);c.fillStyle=skinS;dot2(34,17,2);
      c.fillStyle='#2a1a00';c.beginPath();c.ellipse(32,21,8,3,0,Math.PI*2);c.fill();
      c.fillStyle=skin;dot2(20,14,3);dot2(44,14,3);
      c.fillStyle=skinS;dot2(19,14,1.5);dot2(45,14,1.5);
      // Body
      rect2(24,28,16,8,fC?'#cc0000':RED);
      rect2(22,30,20,24,body);
      rect2(26,28,2,12,body);rect2(36,28,2,12,body);
      dot2(27,39,2,YLW);dot2(37,39,2,YLW);
      rect2(20,28,6,10,fC?'#cc0000':RED);
      rect2(38,28,6,10,fC?'#cc0000':RED);
      // Arms by pose
      if(pose===3){rect2(18,20,6,8,fC?'#cc0000':RED);dot2(21,19,4,WHT);rect2(40,20,6,8,fC?'#cc0000':RED);dot2(43,19,4,WHT);}
      else if(pose===1){rect2(38,29,8,6,fC?'#cc0000':RED);dot2(47,32,4,WHT);}
      else if(pose===2){rect2(18,29,8,6,fC?'#cc0000':RED);dot2(17,32,4,WHT);}
      // Legs by pose
      if(pose===1){rect2(22,52,8,6,body);rect2(22,58,8,2,skin);rect2(20,60,10,6,shoe);rect2(18,66,14,2,shoeS);rect2(34,52,8,6,body);rect2(34,58,8,2,skin);rect2(34,60,10,6,shoe);rect2(34,66,14,2,shoeS);}
      else if(pose===2){rect2(22,52,10,6,body);rect2(22,58,10,2,skin);rect2(22,60,12,6,shoe);rect2(22,66,16,2,shoeS);rect2(32,52,8,6,body);rect2(32,58,8,2,skin);rect2(30,60,10,6,shoe);rect2(28,66,14,2,shoeS);}
      else if(pose===3){rect2(22,52,10,6,body);rect2(22,58,10,4,bodyS);rect2(20,62,14,4,shoe);rect2(18,66,18,2,shoeS);rect2(32,52,10,6,body);rect2(32,58,10,4,bodyS);rect2(30,62,14,4,shoe);rect2(28,66,18,2,shoeS);}
      else{rect2(22,54,8,6,body);rect2(22,60,8,2,skin);rect2(20,62,12,6,shoe);rect2(18,68,16,2,shoeS);rect2(34,54,8,6,body);rect2(34,60,8,2,skin);rect2(34,62,12,6,shoe);rect2(32,68,16,2,shoeS);rect2(21,62,2,2,shoeB);rect2(35,62,2,2,shoeB);}
    } else {
      // Big Mario
      dot2(32,18,13,skin);
      c.fillStyle=cap;c.beginPath();c.ellipse(32,12,16,12,0,Math.PI*2);c.fill();
      dot2(32,7,9,capB);
      c.fillStyle=capS;c.beginPath();c.ellipse(32,19,18,5,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,255,255,0.18)';c.beginPath();c.ellipse(27,6,5,3,0,Math.PI*2);c.fill();
      c.fillStyle=fC?'#ff4444':YLW;c.font='bold 12px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('M',32,10);
      c.fillStyle='#333';dot2(27,17,3.5);dot2(37,17,3.5);
      c.fillStyle=WHT;dot2(26,16,1.5);dot2(36,16,1.5);
      c.fillStyle=BLK;dot2(27,17,1.5);dot2(37,17,1.5);
      dot2(32,22,4,skin);c.fillStyle=skinS;dot2(34,22,2);
      c.fillStyle='#2a1a00';c.beginPath();c.ellipse(32,26,10,4,0,Math.PI*2);c.fill();
      c.fillStyle='#442200';c.beginPath();c.ellipse(24,24,3,2,-0.3,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(40,24,3,2,0.3,0,Math.PI*2);c.fill();
      c.fillStyle=skinS;c.beginPath();c.ellipse(32,29,5,2,0,Math.PI*2);c.fill();
      c.fillStyle=BRN;c.beginPath();c.ellipse(22,15,3,2,0.3,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(42,15,3,2,-0.3,0,Math.PI*2);c.fill();
      c.fillStyle=skin;dot2(18,18,3.5);dot2(46,18,3.5);c.fillStyle=skinS;dot2(17,18,2);dot2(47,18,2);
      // Body
      rect2(22,34,20,14,fC?'#cc0000':RED);
      rect2(20,36,24,36,body);
      rect2(24,34,3,16,body);rect2(37,34,3,16,body);
      dot2(26,48,2.5,YLW);dot2(38,48,2.5,YLW);dot2(25.5,47.5,1,'rgba(255,255,200,0.6)');dot2(37.5,47.5,1,'rgba(255,255,200,0.6)');
      rect2(23,54,20,1.5,bodyS);
      rect2(23,35,2,10,fC?'#dd3333':'#3355dd');rect2(39,35,2,10,fC?'#dd3333':'#3355dd');
      rect2(26,34,12,3,bodyS);
      // Sleeves
      rect2(16,34,8,12,fC?'#cc0000':RED);rect2(40,34,8,12,fC?'#cc0000':RED);
      c.fillStyle='rgba(255,255,255,0.1)';c.beginPath();c.arc(20,40,5,0,Math.PI*2);c.fill();c.beginPath();c.arc(44,40,5,0,Math.PI*2);c.fill();
      // Gloves
      dot2(14,46,5,WHT);dot2(13,44,1.5,WHT);dot2(50,46,5,WHT);dot2(51,44,1.5,WHT);
      c.fillStyle='rgba(0,0,0,0.1)';c.beginPath();c.arc(14,47,3,0,Math.PI*2);c.fill();c.beginPath();c.arc(50,47,3,0,Math.PI*2).fill();
      // Arms
      if(pose===3){rect2(14,24,8,10,fC?'#cc0000':RED);dot2(17,22,5,WHT);rect2(42,24,8,10,fC?'#cc0000':RED);dot2(45,22,5,WHT);}
      else if(pose===1){rect2(40,35,10,8,fC?'#cc0000':RED);dot2(52,39,5,WHT);}
      else if(pose===2){rect2(14,35,10,8,fC?'#cc0000':RED);dot2(12,39,5,WHT);}
      // Legs
      if(pose===1){rect2(22,70,10,8,body);rect2(22,78,10,3,skin);rect2(20,81,12,8,shoe);rect2(18,89,16,2,shoeS);rect2(34,70,10,8,body);rect2(34,78,10,3,skin);rect2(34,81,12,8,shoe);rect2(32,89,16,2,shoeS);}
      else if(pose===2){rect2(20,70,12,8,body);rect2(20,78,12,3,skin);rect2(20,81,14,8,shoe);rect2(18,89,18,2,shoeS);rect2(34,70,10,8,body);rect2(34,78,10,3,skin);rect2(32,81,12,8,shoe);rect2(30,89,16,2,shoeS);}
      else if(pose===3){rect2(20,70,12,8,body);rect2(20,78,12,5,bodyS);rect2(18,83,16,5,shoe);rect2(16,88,20,2,shoeS);rect2(32,70,12,8,body);rect2(32,78,12,5,bodyS);rect2(30,83,16,5,shoe);rect2(28,88,20,2,shoeS);}
      else{rect2(22,72,10,8,body);rect2(22,80,10,3,skin);rect2(20,83,14,8,shoe);rect2(18,91,18,2,shoeS);rect2(34,72,10,8,body);rect2(34,80,10,3,skin);rect2(32,83,14,8,shoe);rect2(30,91,18,2,shoeS);rect2(21,83,2,2,shoeB);rect2(33,83,2,2,shoeB);rect2(24,86,3,2,YLW);rect2(37,86,3,2,YLW);}
    }
    marioCache[key]=t;return t;
  }
  for(var b=0;b<=1;b++)for(var f=0;f<=1;f++)for(var p2=0;p2<=3;p2++)drawMarioSprite(b>0,f>0,p2);


  // ═══ KOOPA SPRITES ═══
  var koopaCache={};
  function generateKoopa(pose){
    var key='koopa_'+pose;if(koopaCache[key])return koopaCache[key];
    var t=document.createElement('canvas');t.width=TILE;t.height=TILE*1.5;
    var tc=t.getContext('2d');var cy=TILE*0.6;
    tc.fillStyle=KOOPA_GREEN;tc.beginPath();tc.ellipse(TILE/2,cy,TILE*0.45,TILE*0.35,0,0,Math.PI*2);tc.fill();
    tc.fillStyle=KOOPA_DARK;tc.beginPath();tc.ellipse(TILE/2,cy,TILE*0.35,TILE*0.25,0,0,Math.PI*2);tc.fill();
    tc.strokeStyle=KOOPA_DARK;tc.lineWidth=1.5;tc.beginPath();tc.moveTo(TILE*0.2,cy);tc.lineTo(TILE*0.8,cy);tc.stroke();
    tc.fillStyle=KOOPA_SKIN;tc.beginPath();tc.arc(TILE*0.65,TILE*0.25,TILE*0.2,0,Math.PI*2);tc.fill();
    tc.fillStyle=WHT;tc.beginPath();tc.arc(TILE*0.7,TILE*0.2,5,0,Math.PI*2);tc.fill();
    tc.fillStyle=BLK;tc.beginPath();tc.arc(TILE*0.72,TILE*0.2,2.5,0,Math.PI*2);tc.fill();
    var fo=pose%2===0?-2:2;
    tc.fillStyle=KOOPA_SKIN;tc.fillRect(TILE*0.3-fo,TILE*1.1,10,8);tc.fillRect(TILE*0.55+fo,TILE*1.1,10,8);
    koopaCache[key]=t;return t;
  }
  for(var kp=0;kp<2;kp++)generateKoopa(kp);
  function getShellSprite(){
    if(koopaCache['shell'])return koopaCache['shell'];
    var t=document.createElement('canvas');t.width=TILE;t.height=TILE;
    var tc=t.getContext('2d');
    tc.fillStyle=KOOPA_GREEN;tc.beginPath();tc.ellipse(TILE/2,TILE/2,TILE*0.45,TILE*0.4,0,0,Math.PI*2);tc.fill();
    tc.fillStyle=KOOPA_DARK;tc.beginPath();tc.ellipse(TILE/2,TILE/2,TILE*0.35,TILE*0.3,0,0,Math.PI*2);tc.fill();
    tc.strokeStyle=KOOPA_DARK;tc.lineWidth=2;tc.beginPath();tc.moveTo(TILE*0.15,TILE/2);tc.lineTo(TILE*0.85,TILE/2);tc.stroke();
    koopaCache['shell']=t;return t;
  }

  // ═══ BUILD LEVEL ═══
  function buildLevel(){
    var lvl=[];for(var y=0;y<WH;y++){lvl[y]=[];for(var x=0;x<WW;x++)lvl[y][x]=0;}
    for(var x=0;x<WW;x++){
      if((x>=40&&x<=41)||(x>=68&&x<=70)||(x>=95&&x<=96)||(x>=130&&x<=132)||(x>=170&&x<=171)||(x>=210&&x<=212)) continue;
      lvl[WH-1][x]=1;lvl[WH-2][x]=1;
    }
    var pd=[
      {x:12,y:5,t:'b',n:2},{x:18,y:4,t:'q',w:1,h:2},{x:22,y:6,t:'b',n:4},
      {x:30,y:4,t:'q',n:3},{x:35,y:7,t:'b',n:2},
      {x:44,y:5,t:'b',n:3},{x:48,y:7,t:'q',n:1},{x:52,y:4,t:'b',n:4},{x:55,y:8,t:'q',n:2},
      {x:60,y:3,t:'p'},{x:62,y:6,t:'b',n:5},{x:64,y:9,t:'b',n:2},
      {x:73,y:4,t:'q',w:4,h:1},{x:75,y:7,t:'b',n:3},
      {x:80,y:3,t:'p',c:'dark'},{x:82,y:5,t:'b',n:4},
      {x:88,y:4,t:'q',n:2},{x:88,y:7,t:'b',n:2},
      {x:92,y:6,t:'b',n:3},{x:98,y:3,t:'p'},
      {x:100,y:5,t:'b',n:2},{x:100,y:8,t:'b',n:2},{x:100,y:11,t:'b',n:2},
      {x:104,y:6,t:'q',n:1},{x:104,y:9,t:'q',n:1},
      {x:108,y:4,t:'b',n:5},{x:112,y:7,t:'q',w:3,h:1},
      {x:118,y:4,t:'b',n:1},{x:119,y:5,t:'b',n:1},{x:120,y:6,t:'b',n:1},{x:121,y:7,t:'b',n:1},
      {x:124,y:5,t:'b',n:3},{x:126,y:8,t:'q',n:2},
      {x:135,y:3,t:'p'},{x:137,y:3,t:'p',c:'dark'},{x:139,y:3,t:'p'},
      {x:136,y:7,t:'b',n:6},{x:142,y:5,t:'q',n:3},
      {x:148,y:5,t:'b',n:2},{x:152,y:7,t:'b',n:2},{x:156,y:4,t:'b',n:2},
      {x:160,y:6,t:'q',n:2},{x:160,y:9,t:'b',n:2},
      {x:165,y:3,t:'p',c:'dark'},{x:167,y:5,t:'b',n:6},
      {x:170,y:7,t:'b',n:3},{x:168,y:9,t:'b',n:5},
      {x:175,y:4,t:'q',w:5,h:1},{x:177,y:7,t:'b',n:2},
      {x:182,y:6,t:'b',n:4},{x:188,y:4,t:'q',n:3},{x:188,y:7,t:'q',n:3},
      {x:192,y:5,t:'b',n:6},{x:195,y:8,t:'b',n:2},
      {x:200,y:4,t:'b',n:3},{x:204,y:6,t:'b',n:2},{x:207,y:4,t:'b',n:2},
      {x:210,y:7,t:'q',n:2},{x:214,y:5,t:'b',n:4},
      {x:218,y:3,t:'p'},{x:220,y:6,t:'b',n:5},
      {x:225,y:4,t:'q',w:3,h:1},{x:230,y:5,t:'b',n:6},
      {x:235,y:3,t:'p',c:'dark'},{x:238,y:4,t:'b',n:5},{x:242,y:6,t:'q',n:2}
    ];
    pd.forEach(function(p){
      if(p.t==='b'){for(var i=0;i<(p.n||1);i++)if(p.x+i<WW&&p.y<WH)lvl[p.y][p.x+i]=(p.c==='dark')?10:2;}
      else if(p.t==='q'){for(var dx2=0;dx2<(p.w||1);dx2++)for(var dy2=0;dy2<(p.h||1);dy2++)if(p.x+dx2<WW&&p.y+dy2<WH)lvl[p.y+dy2][p.x+dx2]=3;}
      else if(p.t==='p'){if(p.x<WW&&p.y+1<WH){lvl[p.y][p.x]=4;lvl[p.y+1][p.x]=5;}}
    });
    return lvl;
  }

  // ═══ INPUT ═══
  var keys={},justPressed={};
  window.addEventListener('keydown',function(e){
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Tab'].indexOf(e.key)>=0)e.preventDefault();
    if(!keys[e.key])justPressed[e.key]=true;keys[e.key]=true;
  });
  window.addEventListener('keyup',function(e){keys[e.key]=false;});
  function k(key){return keys[key]||false;}
  var touchState={left:false,right:false,jump:false,run:false,fire:false};

  // ═══ GAME STATE ═══
  var STATE='TITLE';
  var game={
    lvl:null,particles:[],enemies:[],coins:0,score:0,time:400,lives:3,
    px:3*TILE,py:0,pvx:0,pvy:0,pDir:1,pMode:0,pOnFire:false,
    pInv:0,pStar:0,pAir:true,pJmp:false,pSqY:1.0,pSqX:1.0,
    pCoyote:0,pJbuf:0,pJhold:0,pWasG:true,pAnim:0,
    pOnCar:false,pCar:null,cars:[],cam:0,camShake:0,
    fireballs:[],scorePopups:[],combo:0,comboTimer:0,titleTimer:0
  };

  function initGame(){
    game.lvl=buildLevel();game.particles=[];game.enemies=[];game.fireballs=[];game.scorePopups=[];
    game.coins=0;game.score=0;game.time=400;game.lives=3;
    game.px=3*TILE;game.py=(WH-3)*TILE;game.pvx=0;game.pvy=0;
    game.pDir=1;game.pMode=0;game.pOnFire=false;
    game.pInv=0;game.pStar=0;game.pAir=true;game.pJmp=false;
    game.pSqY=1.0;game.pSqX=1.0;
    game.pCoyote=0;game.pJbuf=0;game.pJhold=0;game.pWasG=true;game.pAnim=0;
    game.pOnCar=false;game.pCar=null;game.cam=0;game.camShake=0;
    game.combo=0;game.comboTimer=0;
    var cc=['#dc2828','#2864dc','#ffc828','#28b450','#b43cb4','#ff6428'];
    game.cars=[];for(var i=0;i<5;i++)game.cars.push({x:(50+i*40)*TILE,y:(WH-3)*TILE,vx:30+Math.random()*20,color:cc[i%cc.length]});
    var ep=[14,24,32,46,54,63,72,83,90,102,110,122,138,149,154,162,174,184,196,205,216,228,236];
    game.enemies=[];ep.forEach(function(ex){game.enemies.push({x:ex*TILE,y:(WH-3)*TILE,vx:-(35+Math.random()*45),t:0,hp:1,type:'goomba'});});
    var kp2=[50,76,93,115,136,158,180,200,222,240];
    kp2.forEach(function(ex){game.enemies.push({x:ex*TILE,y:(WH-3)*TILE,vx:-(30+Math.random()*30),t:0,hp:1,type:'koopa',shell:false,shellVx:0});});
    var pu=[{x:18,y:7,type:'mushroom'},{x:75,y:8,type:'mushroom'},{x:112,y:8,type:'fire'},{x:142,y:6,type:'mushroom'},{x:177,y:8,type:'star'},{x:195,y:9,type:'fire'},{x:214,y:6,type:'mushroom'},{x:230,y:5,type:'fire'}];
    pu.forEach(function(p){game.enemies.push({x:p.x*TILE,y:p.y*TILE,t:0,type:'powerup',puType:p.type,active:true,vy:0,py:p.y*TILE});});
  }

  function getTile(tx,ty){return(tx>=0&&tx<WW&&ty>=0&&ty<WH)?game.lvl[ty][tx]:1;}
  function isSolid(t){return[1,2,3,4,5,6,7,8,9,10].indexOf(t)>=0;}
  function addScorePopup(x,y,text){game.scorePopups.push({x:x,y:y,text:text,life:1.0});}
  function shake(amount){game.camShake=Math.max(game.camShake,amount);}
  function spawnParticles(x,y,col,n){for(var i=0;i<n;i++)game.particles.push({x:x,y:y,vx:(Math.random()-0.5)*150,vy:-Math.random()*250-80,c:col,life:0.3+Math.random()*0.6,sz:2+Math.floor(Math.random()*6)});}

  // ═══ PHYSICS ═══
  function updatePhysics(dt){
    var g=(WH-3)*TILE-2;
    var ax=0;if(k('a')||k('ArrowLeft')||touchState.left)ax=-1;if(k('d')||k('ArrowRight')||touchState.right)ax=1;
    var jmp=k(' ')||k('w')||k('ArrowUp')||touchState.jump;
    var run=k('Shift')||touchState.run;
    var fireBtn=(k('e')||k('x')||touchState.fire)&&justPressed['e'];
    if(touchState.fire&&!keys['e']){fireBtn=true;touchState.fire=false;}
    var spd=run?RUN:WALK;
    game.pAir=game.py<g-1;
    if(ax){var ac=!game.pAir?AG:AY;game.pvx+=(ax*spd-game.pvx)*Math.min(ac*dt,1.0);game.pDir=ax>0?1:0;}
    else{var dc=!game.pAir?DG:DA;if(dc===DG)game.pvx*=Math.max(0,1-12*dt);else game.pvx*=Math.max(0,1-5*dt);if(Math.abs(game.pvx)<5)game.pvx=0;}
    if(game.pAir)game.pCoyote=Math.max(0,game.pCoyote-dt);else game.pCoyote=COYOTE;
    if(jmp)game.pJbuf=JBUF;else game.pJbuf=Math.max(0,game.pJbuf-dt);
    var canJmp=!game.pAir||game.pCoyote>0;
    if(game.pJbuf>0&&canJmp&&!game.pJmp){game.pvy=jmp?JVEL:SHOP;game.pJmp=true;game.pCoyote=0;game.pJbuf=0;game.pJhold=0;game.pSqY=0.7;game.pSqX=1.3;SFX.jump();if(game.pStar>0)spawnParticles(game.px,game.py,STAR_YLW,6);}
    if(game.pJmp&&jmp&&game.pvy<0){game.pJhold+=dt;game.pvy+=GRAV*(game.pJhold<JHOLD?0.4:1.0)*dt;}
    else if(game.pAir)game.pvy+=GRAV*dt;
    if(game.pvy>MFALL)game.pvy=MFALL;
    if(game.pStar>0)game.pvy*=0.999;
    game.px+=game.pvx*dt;game.py+=game.pvy*dt;
    if(game.py>=g){if(!game.pWasG&&game.pvy>200){var imp=Math.min(game.pvy/800,1.0);game.pSqY=1.0+imp*0.4;game.pSqX=1.0-imp*0.25;spawnParticles(game.px,g,GRD,5);shake(imp*3);}game.py=g;game.pvy=0;game.pJmp=false;game.pWasG=true;}else{game.pWasG=false;}
    if(game.py>WH*TILE+200){game.lives--;SFX.die();shake(8);if(game.lives<=0){STATE='GAMEOVER';stopBGM();}else{game.px=3*TILE;game.py=(WH-3)*TILE;game.pvx=0;game.pvy=0;game.pInv=3.0;}}
    game.pSqY+=(1-game.pSqY)*15*dt;game.pSqX+=(1-game.pSqX)*15*dt;
    game.px=Math.max(0,Math.min(WW*TILE-TILE,game.px));
// Horizontal wall collision
var htx = Math.floor(game.px / TILE);
if (game.pvx > 0) {
    var next_htx = htx + 1;
} else if (game.pvx < 0) {
    var next_htx = htx - 1;
}

if (next_htx >= 0 && next_htx < WW && hty >= 0 && hty < WH) {
    var next_tile = getTile(next_htx, hty);
    if (isSolid(next_tile)) {
        // Calculate bounce position
        var bounce_x = next_htx * TILE;
        if (game.pvx > 0) {
            game.px = bounce_x - 4; // Prevent overlap
            game.pvx *= -1;
            SFX.shake(3); // Bounce sound effect
        } else {
            game.px = (next_htx + 1) * TILE + 4;
            game.pvx *= -1;
            SFX.shake(3);
        }
    }
}
// Ceiling collision (ground/ceiling tile collision)
// If player is moving upward and hits a solid tile above, snap to the ceiling
var ceil_htx = Math.floor(game.px / TILE);
var ceil_hty = Math.floor((game.py - TILE) / TILE);
if (game.pvy < 0 && ceil_hty >= 0 && ceil_hty < WH) {
    var ceil_tile = getTile(ceil_htx, ceil_hty);
    if (isSolid(ceil_tile)) {
        // Snap player to the ceiling
        game.py = (ceil_hty + 1) * TILE;
        game.pvy = 0;
        SFX.shake(2); // small feedback
    }
}
    var htx=Math.floor(game.px/TILE),hty=Math.floor(game.py/TILE),ht=getTile(htx,hty);
    if(isSolid(ht)&&game.py<hty*TILE){
      game.pvy=50;
      if(ht===3){game.coins++;game.score+=200;SFX.coin();game.lvl[hty][htx]=9;spawnParticles(htx*TILE+TILE/2,hty*TILE,YLW,8);shake(2);addScorePopup(htx*TILE,hty*TILE-20,'200');}
      else if(ht===8){game.score+=1000;SFX.coin();game.lvl[hty][htx]=9;spawnParticles(htx*TILE+TILE/2,hty*TILE,YLW,12);shake(3);addScorePopup(htx*TILE,hty*TILE-20,'1000');var puType=Math.random()>0.5?'mushroom':'fire';game.enemies.push({x:htx*TILE,y:(hty-1)*TILE,t:0,type:'powerup',puType:puType,active:true,vy:-200,py:(hty-1)*TILE});}
      else if(ht===2&&game.pMode>0){game.lvl[hty][htx]=0;game.score+=50;SFX.breakBrick();shake(3);spawnParticles(htx*TILE+TILE/2,hty*TILE+10,BRC,10);addScorePopup(htx*TILE,hty*TILE-20,'50');}
    }
    if(game.comboTimer>0){game.comboTimer-=dt;if(game.comboTimer<=0)game.combo=0;}
    // Enemies
    for(var ei=game.enemies.length-1;ei>=0;ei--){
      var e=game.enemies[ei];
      if(e.hp<=0&&e.type!=='powerup')continue;
      if(e.type==='powerup'){
        if(!e.active)continue;
        if(e.vy<0){e.vy+=600*dt;e.y+=e.vy*dt;if(e.y<=e.py-TILE){e.y=e.py-TILE;e.vy=0;e.vx=game.pDir>0?80:-80;}}
        else{e.x+=e.vx*dt;e.vy+=GRAV*0.6*dt;e.y+=e.vy*dt;var eg=(WH-3)*TILE;if(e.y>=eg){e.y=eg;e.vy=0;}var etx=Math.floor(e.x/TILE);if(isSolid(getTile(etx,Math.floor(e.y/TILE))))e.vx*=-1;}
        if(Math.abs(e.x-game.px)<TILE*0.8&&Math.abs(e.y-game.py)<TILE*1.5){
          if(e.puType==='mushroom'){if(game.pMode===0){game.pMode=1;SFX.mushroom();}game.score+=1000;}
          else if(e.puType==='fire'){game.pMode=2;game.pOnFire=true;SFX.mushroom();game.score+=1000;}
          else if(e.puType==='star'){game.pStar=8.0;SFX.star();game.score+=2000;}
          addScorePopup(e.x,e.y-20,'1000');game.enemies.splice(ei,1);continue;
        }
        continue;
      }
      if(e.type==='goomba'){
        e.x+=e.vx*dt;e.t+=dt;
        var nxt=Math.floor((e.x+(e.vx>0?TILE:0))/TILE);
        if(isSolid(getTile(nxt,Math.floor(e.y/TILE)+1))||!isSolid(getTile(nxt,Math.floor(e.y/TILE)+2)))e.vx*=-1;
        if(Math.abs(e.x-game.px)<TILE*0.8&&Math.abs(e.y-game.py)<TILE*0.8){
          if(game.pvy>0&&game.py<e.y-TILE/3){e.hp=0;game.pvy=JVEL*0.6;game.score+=100*(1+game.combo);game.combo++;game.comboTimer=2;SFX.stomp();if(game.combo>1)SFX.combo(game.combo);spawnParticles(e.x,e.y,GOM,8);shake(2);addScorePopup(e.x,e.y-20,''+(100*(1+game.combo)));}
          else if(game.pStar>0){e.hp=0;game.score+=200;spawnParticles(e.x,e.y,STAR_YLW,6);}
          else if(game.pInv<=0){if(game.pMode>0){game.pMode=0;game.pOnFire=false;game.pInv=2.0;SFX.hurt();shake(5);}else{game.lives--;SFX.hurt();shake(6);if(game.lives<=0){STATE='GAMEOVER';stopBGM();SFX.die();}else game.pInv=2.0;}}
        }
      }
      if(e.type==='koopa'){
        if(e.shell){
          e.x+=e.shellVx*dt;e.t+=dt;
          var ns=Math.floor((e.x+(e.shellVx>0?TILE:0))/TILE);
          if(isSolid(getTile(ns,Math.floor(e.y/TILE)+1))||!isSolid(getTile(ns,Math.floor(e.y/TILE)+2))){e.shellVx*=-1;SFX.shellBounce();}
          for(var ej=0;ej<game.enemies.length;ej++){var oe=game.enemies[ej];if(oe===e||oe.hp<=0||oe.type==='powerup')continue;if(Math.abs(oe.x-e.x)<TILE&&Math.abs(oe.y-e.y)<TILE){oe.hp=0;game.score+=200;spawnParticles(oe.x,oe.y,oe.type==='goomba'?GOM:KOOPA_GREEN,8);SFX.shellBounce();}}
          if(Math.abs(e.x-game.px)<TILE*0.8&&Math.abs(e.y-game.py)<TILE*0.8){
            if(game.pvy>0&&game.py<e.y-TILE/3){e.shellVx=0;game.pvy=JVEL*0.5;SFX.koopaStomp();}
            else if(game.pStar>0){e.hp=0;game.score+=200;}
            else if(game.pInv<=0){if(Math.abs(game.pvx)>10){e.shellVx=game.pDir>0?350:-350;SFX.shellKick();shake(3);}else{if(game.pMode>0){game.pMode=0;game.pOnFire=false;game.pInv=2.0;SFX.hurt();}else{game.lives--;SFX.hurt();if(game.lives<=0){STATE='GAMEOVER';stopBGM();SFX.die();}else game.pInv=2.0;}}}
          }
        } else {
          e.x+=e.vx*dt;e.t+=dt;
          var nxt2=Math.floor((e.x+(e.vx>0?TILE:0))/TILE);
          if(isSolid(getTile(nxt2,Math.floor(e.y/TILE)+1))||!isSolid(getTile(nxt2,Math.floor(e.y/TILE)+2)))e.vx*=-1;
          if(Math.abs(e.x-game.px)<TILE*0.8&&Math.abs(e.y-game.py)<TILE*0.8){
            if(game.pvy>0&&game.py<e.y-TILE/3){e.shell=true;e.shellVx=0;game.pvy=JVEL*0.5;game.score+=100;SFX.koopaStomp();spawnParticles(e.x,e.y,KOOPA_GREEN,6);}
            else if(game.pStar>0){e.hp=0;game.score+=200;spawnParticles(e.x,e.y,STAR_YLW,6);}
            else if(game.pInv<=0){if(game.pMode>0){game.pMode=0;game.pOnFire=false;game.pInv=2.0;SFX.hurt();}else{game.lives--;SFX.hurt();if(game.lives<=0){STATE='GAMEOVER';stopBGM();SFX.die();}else game.pInv=2.0;}}
          }
        }
      }
    }
    // Fireballs
    if(fireBtn&&game.pOnFire&&game.fireballs.length<2){game.fireballs.push({x:game.px+(game.pDir>0?TILE:-TILE),y:game.py-TILE/2,vx:(game.pDir>0?1:-1)*400,vy:0,bounces:0});SFX.fireball();}
    for(var fi=game.fireballs.length-1;fi>=0;fi--){var fb=game.fireballs[fi];fb.x+=fb.vx*dt;fb.vy+=GRAV*0.5*dt;fb.y+=fb.vy*dt;if(fb.y>=(WH-3)*TILE){fb.y=(WH-3)*TILE;fb.vy=-350;fb.bounces++;spawnParticles(fb.x,fb.y,'#ff6600',3);}if(fb.bounces>3||fb.x<game.cam-100||fb.x>game.cam+W+100){game.fireballs.splice(fi,1);continue;}for(var ei2=0;ei2<game.enemies.length;ei2++){var e2=game.enemies[ei2];if(e2.hp<=0||e2.type==='powerup')continue;if(Math.abs(e2.x-fb.x)<TILE&&Math.abs(e2.y-fb.y)<TILE){e2.hp=0;game.score+=200;spawnParticles(e2.x,e2.y,'#ff4400',8);SFX.stomp();game.fireballs.splice(fi,1);break;}}}
    // Particles
    for(var pi=game.particles.length-1;pi>=0;pi--){var p=game.particles[pi];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=GRAV*0.5*dt;p.life-=dt;if(p.life<=0)game.particles.splice(pi,1);}
    // Score popups
    for(var si=game.scorePopups.length-1;si>=0;si--){var sp=game.scorePopups[si];sp.y-=40*dt;sp.life-=dt;if(sp.life<=0)game.scorePopups.splice(si,1);}
    // Cars
    for(var ci=0;ci<game.cars.length;ci++){var c=game.cars[ci];c.x+=c.vx*dt;if(c.x<0||c.x>WW*TILE)c.vx*=-1;}
    if(k('f')&&justPressed['f']){initAudio();if(game.pOnCar){game.pOnCar=false;game.pCar=null;SFX.enterCar();}else{for(var ci2=0;ci2<game.cars.length;ci2++){var c3=game.cars[ci2];if(Math.abs(c3.x-game.px)<TILE*2&&Math.abs(c3.y-game.py)<TILE*2){game.pOnCar=true;game.pCar=c3;SFX.enterCar();break;}}}}
    if(game.pOnCar&&game.pCar){var c4=game.pCar;game.px=c4.x;game.py=c4.y-TILE;if(k('d')||touchState.right)c4.vx=Math.min(c4.vx+200*dt,400);else if(k('a')||touchState.left)c4.vx=Math.max(c4.vx-200*dt,-200);else{c4.vx*=Math.max(0,1-3*dt);if(Math.abs(c4.vx)<1)c4.vx=0;}if(c4.vx!==0&&Math.random()<0.15)spawnParticles(c4.x-c4.vx*0.01,c4.y,'#666666',2);}
    var target=game.px-W/3;target=Math.max(0,Math.min(WW*TILE-W,target));game.cam+=(target-game.cam)*10*dt;
    if(game.camShake>0)game.camShake*=0.9;if(game.camShake<0.5)game.camShake=0;
    game.time-=dt;
    if(game.time<=0){game.lives--;SFX.die();if(game.lives<=0){STATE='GAMEOVER';stopBGM();}else{game.time=400;game.px=3*TILE;game.py=(WH-3)*TILE;game.pvx=0;game.pvy=0;game.pInv=3.0;}}
    if(game.pStar>0){game.pStar-=dt;if(game.pStar<=0)game.pStar=0;}
    if(game.pInv>0)game.pInv-=dt;
  }

  // ═══ RENDERING ═══
  function draw(){
    ctx.save();
    if(game.camShake>0)ctx.translate((Math.random()-0.5)*game.camShake*2,(Math.random()-0.5)*game.camShake);
    for(var b=0;b<4;b++){var r=b/4;ctx.fillStyle='rgb('+(SKY[0]+(180-SKY[0])*r)+','+(SKY[1]+(220-SKY[1])*r)+','+(SKY[2]+(255-SKY[2])*r)+')';ctx.fillRect(0,b*H/4,W,H/4+1);}
    if(game.pStar>0){ctx.globalAlpha=0.08+Math.sin(Date.now()*0.01)*0.04;ctx.fillStyle=STAR_YLW;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
    var px=game.cam*0.1;ctx.fillStyle='rgba(255,255,255,0.4)';
    for(var i=0;i<20;i++){var cx=((i*220+80)-px)%(W+200)-100,cy=30+(i%6)*50,sz=25+(i%4)*12;ctx.beginPath();ctx.arc(cx,cy,sz*0.5,0,Math.PI*2);ctx.arc(cx+sz*0.4,cy-sz*0.2,sz*0.4,0,Math.PI*2);ctx.arc(cx+sz*0.8,cy,sz*0.35,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#2d8a4e';for(var j=0;j<25;j++){var hx=((j*280)-(game.cam*0.2))%(W+300)-150,hy=H*0.72,hs=50+(j%5)*25;ctx.beginPath();ctx.moveTo(hx-hs,hy);ctx.quadraticCurveTo(hx,hy-hs,hx+hs,hy);ctx.fill();}
    ctx.fillStyle='#1a6830';for(var j2=0;j2<18;j2++){var hx2=((j2*380+100)-(game.cam*0.1))%(W+400)-200,hy2=H*0.75,hs2=70+(j2%4)*35;ctx.beginPath();ctx.moveTo(hx2-hs2,hy2);ctx.quadraticCurveTo(hx2,hy2-hs2*0.8,hx2+hs2,hy2);ctx.fill();}
    var cx2=Math.floor(game.cam);
    var stx=Math.max(0,Math.floor(cx2/TILE)-1),etx=Math.min(WW,Math.floor(cx2/TILE)+Math.ceil(W/TILE)+2);
    for(var tx=stx;tx<etx;tx++){for(var ty=0;ty<WH;ty++){var t=game.lvl[ty][tx];if(t===0)continue;var sx=Math.floor(tx*TILE-cx2);if(t===4){ctx.drawImage(renderPipe(true),sx,ty*TILE);}else if(t===5){ctx.drawImage(renderPipe(false),sx,ty*TILE);}else if(tileCanvases[t]){if(-TILE<sx<W+TILE)ctx.drawImage(tileCanvases[t],sx,ty*TILE);}}}
    // Enemies
    for(var ei=0;ei<game.enemies.length;ei++){
      var e=game.enemies[ei];if(e.hp<=0&&e.type!=='powerup')continue;if(e.type==='powerup'&&!e.active)continue;
      var ex=Math.floor(e.x-cx2),ey=Math.floor(e.y);if(ex<-TILE*2||ex>W+TILE*2)continue;
      if(e.type==='powerup'){
        if(e.puType==='mushroom'){ctx.fillStyle='#e63946';ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE/3,TILE*0.4,TILE*0.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(ex+TILE/3,ey-TILE/2,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=SKN;ctx.fillRect(ex+TILE*0.35,ey-TILE*0.1,TILE*0.3,TILE*0.25);}
        else if(e.puType==='fire'){ctx.fillStyle='#ff6600';ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE/3,TILE*0.4,TILE*0.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=YLW;ctx.beginPath();ctx.arc(ex+TILE/3,ey-TILE/2,4,0,Math.PI*2);ctx.fill();ctx.fillStyle=SKN;ctx.fillRect(ex+TILE*0.35,ey-TILE*0.1,TILE*0.3,TILE*0.25);}
        else if(e.puType==='star'){var ss=Math.sin(Date.now()*0.008)*0.3+1;ctx.save();ctx.translate(ex+TILE/2,ey-TILE/2);ctx.scale(ss,ss);ctx.fillStyle=STAR_YLW;ctx.beginPath();for(var si=0;si<5;si++){var a=si*Math.PI*2/5-Math.PI/2,a2=a+Math.PI/5;ctx.lineTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a2)*6,Math.sin(a2)*6);}ctx.closePath();ctx.fill();ctx.fillStyle=WHT;ctx.beginPath();ctx.arc(-3,-3,3,0,Math.PI*2);ctx.fill();ctx.fillStyle=BLK;ctx.beginPath();ctx.arc(-2,-3,1.5,0,Math.PI*2);ctx.fill();ctx.restore();}
        continue;
      }
      if(e.type==='goomba'){
        // Body (round, detailed)
        ctx.fillStyle=GOM;
        ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE/4,TILE/2,TILE/4,0,0,Math.PI*2);ctx.fill();
        // Body highlight
        ctx.fillStyle='rgba(255,200,100,0.2)';
        ctx.beginPath();ctx.ellipse(ex+TILE/2-4,ey-TILE/3,TILE/4,TILE/6,0,0,Math.PI*2);ctx.fill();
        // Head (darker brown)
        ctx.fillStyle='#8b5e34';
        ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE/2.5,TILE*0.35,TILE*0.25,0,0,Math.PI*2);ctx.fill();
        // Angry eyebrows
        ctx.fillStyle=BLK;
        ctx.save();ctx.translate(ex+TILE/3,ey-TILE/3);
        ctx.rotate(-0.3);ctx.fillRect(0,0,TILE/5,TILE/12);ctx.restore();
        ctx.save();ctx.translate(ex+TILE/2,ey-TILE/3);
        ctx.rotate(0.3);ctx.fillRect(0,0,TILE/5,TILE/12);ctx.restore();
        // Eyes (white with pupils)
        ctx.fillStyle=WHT;
        ctx.beginPath();ctx.arc(ex+TILE/3,ey-TILE/2.8,3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(ex+TILE*2/3,ey-TILE/2.8,3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=BLK;
        ctx.beginPath();ctx.arc(ex+TILE/3+1,ey-TILE/2.8,1.5,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(ex+TILE*2/3+1,ey-TILE/2.8,1.5,0,Math.PI*2);ctx.fill();
        // Feet with animation
        var fo=Math.floor(e.t*4)%2===0?0:4;
        ctx.fillStyle=BLK;
        ctx.beginPath();ctx.ellipse(ex+TILE/5+fo,ey+TILE/2-2,TILE/5,TILE/8,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.ellipse(ex+TILE*3/5-fo,ey+TILE/2-2,TILE/5,TILE/8,0,0,Math.PI*2);ctx.fill();
        // Foot highlight
        ctx.fillStyle='rgba(255,255,255,0.1)';
        ctx.beginPath();ctx.ellipse(ex+TILE/5+fo,ey-TILE/2-4,TILE/8,TILE/12,0,0,Math.PI*2);ctx.fill();
      }
      if(e.type==='koopa'){
        if(e.shell){
          // Detailed shell
          var ss=getShellSprite();ctx.drawImage(ss,ex,ey-TILE,TILE,TILE);
          // Shell shine
          ctx.fillStyle='rgba(255,255,255,0.15)';
          ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE/2,TILE/3,TILE/4,0,0,Math.PI*2);ctx.fill();
        } else {
          // Detailed koopa body
          ctx.fillStyle=KOOPA_GREEN;
          ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE*0.55,TILE*0.45,TILE*0.35,0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=KOOPA_DARK;
          ctx.beginPath();ctx.ellipse(ex+TILE/2,ey-TILE*0.55,TILE*0.35,TILE*0.25,0,0,Math.PI*2).fill();
          // Shell highlight
          ctx.fillStyle='rgba(255,255,255,0.12)';
          ctx.beginPath();ctx.ellipse(ex+TILE/2-3,ey-TILE*0.45,TILE/4,TILE/5,0,0,Math.PI*2);ctx.fill();
          // Head
          ctx.fillStyle=KOOPA_SKIN;
          ctx.beginPath();ctx.arc(ex+TILE*0.65,ey-TILE*0.2,TILE*0.2,0,Math.PI*2);ctx.fill();
          // Eye
          ctx.fillStyle=WHT;ctx.beginPath();ctx.arc(ex+TILE*0.68,ey-TILE*0.18,4,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=BLK;ctx.beginPath();ctx.arc(ex+TILE*0.7,ey-TILE*0.18,2,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=WHT;ctx.beginPath();ctx.arc(ex+TILE*0.69,ey-TILE*0.17,1,0,Math.PI*2);ctx.fill();
          // Feet
          var kfo=Math.floor(e.t*3)%2===0?-3:3;
          ctx.fillStyle=KOOPA_SKIN;
          ctx.beginPath();ctx.ellipse(ex+TILE*0.35+kfo,ey-TILE*0.85,TILE*0.12,TILE*0.08,0,0,Math.PI*2);ctx.fill();
          ctx.beginPath();ctx.ellipse(ex+TILE*0.6-kfo,ey-TILE*0.85,TILE*0.12,TILE*0.08,0,0,Math.PI*2);ctx.fill();
        }
      }
    }
    // Fireballs
    for(var fi=0;fi<game.fireballs.length;fi++){var fb=game.fireballs[fi];var fbx=Math.floor(fb.x-cx2),fby=Math.floor(fb.y);ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(fbx,fby,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=YLW;ctx.beginPath();ctx.arc(fbx,fby,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=0.4;ctx.fillStyle='#ff6600';ctx.beginPath();ctx.arc(fbx-fb.vx*0.01,fby,4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    // Particles
    for(var pi=0;pi<game.particles.length;pi++){var p=game.particles[pi];var psz=Math.max(1,Math.floor(p.sz*p.life/0.5));ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x-cx2,p.y,psz,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    // Cars
    for(var ci=0;ci<game.cars.length;ci++){var c=game.cars[ci];var csx=Math.floor(c.x-cx2);if(-TILE*2<csx<W+TILE*2){var csy=Math.floor(c.y-TILE/2);ctx.fillStyle=c.color;ctx.beginPath();ctx.roundRect(csx,csy,TILE*2,TILE/2,6);ctx.fill();ctx.fillStyle='#3c3c46';ctx.beginPath();ctx.roundRect(csx+TILE/2,csy-TILE/2,TILE,TILE/2,4);ctx.fill();ctx.fillStyle='#96c8f0';ctx.fillRect(csx+TILE/2+4,csy-TILE/2+4,TILE-8,TILE/3);ctx.fillStyle='#1e1e1e';ctx.beginPath();ctx.arc(csx+TILE/3,csy+TILE/2,TILE/4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(csx+TILE*5/3,csy+TILE/2,TILE/4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#555555';ctx.beginPath();ctx.arc(csx+TILE/3,csy+TILE/2,TILE/8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(csx+TILE*5/3,csy+TILE/2,TILE/8,0,Math.PI*2);ctx.fill();ctx.fillStyle=YLW;ctx.fillRect(csx+TILE*2-4,csy+6,4,8);ctx.fillRect(csx,csy+6,4,8);}}
    // Player
    if(!game.pOnCar){
      var psx=Math.floor(game.px-cx2),psy=Math.floor(game.py);
      var big=game.pMode>0,fire=game.pMode===2;
      var pose;if(game.pAir)pose=3;else if(Math.abs(game.pvx)>20)pose=Math.floor(game.pAnim*8)%2===0?1:2;else pose=0;
      var sprKey=(big?1:0)+'_'+(fire?1:0)+'_'+pose,spr=marioCache[sprKey];
      if(spr){
        var sw=spr.width*game.pSqX,sh=spr.height*game.pSqY;ctx.save();
        if(game.pStar>0){ctx.shadowColor=STAR_YLW;ctx.shadowBlur=15+Math.sin(Date.now()*0.01)*5;}
        if(game.pDir===0){ctx.translate(psx,0);ctx.scale(-1,1);ctx.drawImage(spr,-sw/2,psy-sh,sw,sh);}else ctx.drawImage(spr,psx-sw/2,psy-sh,sw,sh);
        ctx.restore();ctx.shadowBlur=0;
        if(game.pInv>0&&Math.floor(game.pInv*10)%2===0){ctx.globalAlpha=0.25;ctx.fillStyle=WHT;ctx.fillRect(psx-sw/2,psy-sh,sw,sh);ctx.globalAlpha=1;}
      }
    }
    // Score popups
    for(var si=0;si<game.scorePopups.length;si++){var sp=game.scorePopups[si];ctx.globalAlpha=sp.life;ctx.fillStyle=YLW;ctx.font='bold 14px "Press Start 2P", Arial';ctx.textAlign='center';ctx.fillText(sp.text,sp.x-cx2,sp.y);}ctx.globalAlpha=1;
    // HUD
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,W,50);
    ctx.font='bold 18px Inter, Arial, sans-serif';ctx.textBaseline='middle';var hy=25;
    ctx.fillStyle=YLW;ctx.textAlign='center';ctx.fillText('SUPER MARIO BROS',W/2,hy);
    ctx.textAlign='left';ctx.fillStyle=YLW;ctx.fillText('🪙 '+game.coins,15,hy);
    ctx.fillStyle=WHT;ctx.fillText('SCORE: '+game.score,180,hy);
    ctx.fillStyle=game.time<50?RED:WHT;ctx.fillText('⏱ '+Math.max(0,Math.floor(game.time)),380,hy);
    ctx.fillStyle=WHT;ctx.textAlign='right';ctx.fillText('♥ x'+game.lives,W-15,hy);
    if(game.combo>1){ctx.fillStyle=YLW;ctx.textAlign='center';ctx.font='bold 12px "Press Start 2P", Arial';ctx.fillText('COMBO x'+game.combo,W/2,45);}
    if(game.pOnFire){ctx.fillStyle='#ff6600';ctx.font='12px Inter';ctx.textAlign='left';ctx.fillText('🔥 FIRE',15,45);}
    if(game.pStar>0){ctx.fillStyle=STAR_YLW;ctx.font='12px Inter';ctx.textAlign='left';ctx.fillText('⭐ STAR',80,45);}
    if(game.pOnCar){ctx.fillStyle='rgba(255,200,0,0.8)';ctx.textAlign='center';ctx.font='12px Inter';ctx.fillText('🚗 [F] Exit',W/2,65);}
    ctx.restore();
  }

  // ═══ TITLE ═══
  function drawTitle(){
    var grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#1a1a2e');grd.addColorStop(0.5,'#16213e');grd.addColorStop(1,'#0f3460');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    for(var i=0;i<60;i++){var sx=(Math.sin(i*127.1+game.titleTimer*0.3)*0.5+0.5)*W,sy=(Math.cos(i*311.7+game.titleTimer*0.2)*0.5+0.5)*H*0.6;ctx.fillStyle='rgba(255,255,255,'+(Math.sin(game.titleTimer*3+i)*0.3+0.7)*0.4+')';ctx.beginPath();ctx.arc(sx,sy,1.5,0,Math.PI*2);ctx.fill();}
    var ts=Math.min(W/800,H/600),ty=H*0.28;
    ctx.save();ctx.translate(W/2,ty);ctx.scale(ts,ts);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.font='bold 64px "Press Start 2P", Arial Black, Impact, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('SUPER MARIO',3,3);
    var rg=ctx.createLinearGradient(-200,-30,200,30);rg.addColorStop(0,'#ff4444');rg.addColorStop(0.5,'#ff6666');rg.addColorStop(1,'#cc0000');ctx.fillStyle=rg;ctx.fillText('SUPER MARIO',0,0);
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeText('SUPER MARIO',0,0);
    var sy=65;ctx.font='bold 32px "Press Start 2P", Arial Black, Impact, sans-serif';ctx.fillStyle='#ffd60a';ctx.fillText('×',0,sy-12);
    ctx.font='bold 44px "Press Start 2P", Arial Black, Impact, sans-serif';ctx.fillStyle='#00e5ff';ctx.fillText('GTA',0,sy+22);
    ctx.shadowColor='#e040fb';ctx.shadowBlur=20;ctx.fillStyle='#e040fb';ctx.font='bold 52px "Press Start 2P", Arial Black, Impact, sans-serif';ctx.fillText('6',95,sy+22);ctx.shadowBlur=0;
    ctx.restore();
    var charY=H*0.52,bobY=Math.sin(game.titleTimer*3)*5,spr=marioCache['1_0_0'];
    if(spr){ctx.drawImage(spr,W/2-spr.width/2,charY+bobY,spr.width*1.5,spr.height*1.5);var ks=koopaCache['koopa_0'];if(ks)ctx.drawImage(ks,W/2+50,charY+bobY+10,TILE*1.2,TILE*1.8);}
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(W/2,charY+spr.height*1.5+bobY+5,35,7,0,0,Math.PI*2);ctx.fill();
    if(Math.floor(game.titleTimer*2)%2===0){ctx.font=Math.floor(14*ts)+'px "Press Start 2P", monospace';ctx.fillStyle=WHT;ctx.textAlign='center';ctx.fillText('PRESS ENTER OR TAP TO START',W/2,H*0.74);}
    ctx.font=Math.floor(10*ts)+'px Inter, Arial, sans-serif';ctx.fillStyle='#667788';ctx.textAlign='center';
    ctx.fillText('← → Move  |  ↑ Space Jump  |  ⇧ Run  |  F Car  |  E/X Fire  |  Esc Pause',W/2,H*0.83);
    ctx.font=Math.floor(9*ts)+'px monospace';ctx.fillStyle='#445566';ctx.textAlign='right';ctx.fillText('V1.2 — © 2026 Hazem Soussi (HA)',W-10,H-12);
    ctx.textAlign='left';ctx.fillText('Nano Engine — 418 lines — MIT License',10,H-12);
  }

  // ═══ PAUSE ═══
  function drawPause(){
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);
    var bw=380,bh=320,bx=(W-bw)/2,by=(H-bh)/2;
    ctx.fillStyle='rgba(17,17,24,0.95)';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.fill();
    ctx.strokeStyle='rgba(230,57,70,0.5)';ctx.lineWidth=2;ctx.stroke();
    ctx.font='bold 32px Inter, Arial Black, sans-serif';ctx.fillStyle='#e63946';ctx.textAlign='center';ctx.fillText('PAUSED',W/2,by+55);
    ctx.font='15px Inter, Arial, sans-serif';ctx.fillStyle='#8888aa';
    var sy=by+110,lh=28;
    ctx.fillText('Score: '+game.score,W/2,sy);ctx.fillText('Coins: '+game.coins,W/2,sy+lh);ctx.fillText('Time: '+Math.floor(game.time),W/2,sy+lh*2);ctx.fillText('Lives: '+game.lives,W/2,sy+lh*3);
    if(game.combo>1){ctx.fillStyle=YLW;ctx.fillText('Combo: x'+game.combo,W/2,sy+lh*4);}
    if(Math.floor(Date.now()/500)%2===0){ctx.font='13px monospace';ctx.fillStyle='#ffd60a';ctx.fillText('Press ESC to Resume',W/2,by+bh-35);}
  }

  // ═══ GAME OVER ═══
  function drawGameOver(){
    ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,W,H);
    var gs=Math.min(W/800,H/600);
    ctx.font=Math.floor(44*gs)+'px "Press Start 2P", Arial Black, Impact, sans-serif';ctx.fillStyle='#e63946';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#ff0000';ctx.shadowBlur=30;ctx.fillText('GAME OVER',W/2,H*0.28);ctx.shadowBlur=0;
    ctx.font=Math.floor(15*gs)+'px Inter, Arial, sans-serif';ctx.fillStyle=WHT;
    ctx.fillText('Final Score: '+game.score,W/2,H*0.42);ctx.fillText('Coins: '+game.coins,W/2,H*0.49);
    if(game.combo>1)ctx.fillText('Best Combo: x'+game.combo,W/2,H*0.56);
    if(Math.floor(Date.now()/600)%2===0){ctx.font=Math.floor(13*gs)+'px monospace';ctx.fillStyle='#ffd60a';ctx.fillText('Press ENTER to Restart',W/2,H*0.7);}
    ctx.font=Math.floor(9*gs)+'px monospace';ctx.fillStyle='#445566';ctx.fillText('© 2026 Hazem Soussi (HA)',W/2,H*0.9);
  }

  // ═══ TOUCH CONTROLS ═══
  function drawTouchControls(){
    if(window.innerWidth>768)return;
    ctx.globalAlpha=0.5;
    var dpadX=60,dpadY=H-100,dpadR=40;
    ctx.fillStyle=touchState.left?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(dpadX-dpadR,dpadY,dpadR*0.6,0,Math.PI*2);ctx.fill();ctx.fillStyle=WHT;ctx.font='20px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('←',dpadX-dpadR,dpadY);
    ctx.fillStyle=touchState.right?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(dpadX+dpadR,dpadY,dpadR*0.6,0,Math.PI*2);ctx.fill();ctx.fillStyle=WHT;ctx.fillText('→',dpadX+dpadR,dpadY);
    var jbX=W-100,jbY=H-100,jbR=45;
    ctx.fillStyle=touchState.jump?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(jbX,jbY,jbR,0,Math.PI*2);ctx.fill();ctx.fillStyle=WHT;ctx.font='bold 14px Arial';ctx.fillText('JUMP',jbX,jbY);
    var fbX=W-200,fbY=H-100,fbR=30;
    ctx.fillStyle=touchState.fire?'rgba(255,100,0,0.5)':'rgba(255,100,0,0.2)';ctx.beginPath();ctx.arc(fbX,fbY,fbR,0,Math.PI*2);ctx.fill();ctx.fillStyle=WHT;ctx.font='bold 11px Arial';ctx.fillText('FIRE',fbX,fbY);
    ctx.globalAlpha=1;
  }
  function handleTouch(e){
    e.preventDefault();var rect=canvas.getBoundingClientRect();
    touchState.left=false;touchState.right=false;touchState.jump=false;touchState.fire=false;
    for(var i=0;i<e.touches.length;i++){
      var t=e.touches[i],tx=(t.clientX-rect.left)/rect.width*W,ty=(t.clientY-rect.top)/rect.height*H;
      if(tx<W*0.25&&ty>H*0.5)touchState.left=true;
      if(tx>W*0.25&&tx<W*0.5&&ty>H*0.5)touchState.right=true;
      if(tx>W*0.7&&ty>H*0.5)touchState.jump=true;
      if(tx>W*0.5&&tx<W*0.7&&ty>H*0.5)touchState.fire=true;
    }
  }
  canvas.addEventListener('touchstart',handleTouch,{passive:false});
  canvas.addEventListener('touchmove',handleTouch,{passive:false});
  canvas.addEventListener('touchend',function(e){e.preventDefault();touchState.left=false;touchState.right=false;touchState.jump=false;touchState.fire=false;},{passive:false});

  // ═══ MAIN LOOP ═══
  var lastTime=0;
  function gameLoop(ts){
    if(!lastTime)lastTime=ts;
    var rawDt=(ts-lastTime)/1000,dt=Math.min(rawDt,0.05);
    lastTime=ts;
    resizeCanvas();
    if(STATE==='TITLE'){
      game.titleTimer+=dt;drawTitle();
      if((k('Enter')&&justPressed['Enter'])||touchState.jump){initAudio();SFX.start();initGame();STATE='PLAYING';startBGM();}
    } else if(STATE==='PLAYING'){
      if(k('Escape')&&justPressed['Escape']){STATE='PAUSED';stopBGM();}
      game.pAnim+=dt;updatePhysics(dt);draw();drawTouchControls();
    } else if(STATE==='PAUSED'){
      draw();drawPause();
      if(k('Escape')&&justPressed['Escape']){STATE='PLAYING';startBGM();}
    } else if(STATE==='GAMEOVER'){
      drawGameOver();
      if(k('Enter')&&justPressed['Enter']){initGame();STATE='PLAYING';SFX.start();startBGM();}
    }
    for(var ky in justPressed)delete justPressed[ky];
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);
;
} catch(gameErr) { window._gameErrors.push('FATAL: ' + gameErr.toString()); }
;
