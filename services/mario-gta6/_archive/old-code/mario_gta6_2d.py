"""
SUPER MARIO GTA6 — V4.0.0 ETHICS-FIRST UNIFIED ENGINE
═══════════════════════════════════════════════════════════════
NO enemies, NO guns, NO death, NO violence.
Defenders → recruited as buddies. Dash Attack with Peace (sumo push).
Spark effects instead of blood. Shield instead of armor.
Harmony instead of combat. The goal is connection.

SPDX-License-Identifier: MIT | Copyright (c) 2026 Hazem Soussi (HA)
"""
import os,math,random,traceback
os.environ['PYGAME_HIDE_SUPPORT_PROMPT']='1';os.environ['SDL_AUDIODRIVER']='disk'
import pygame

# ═══ CONSTANTS ═══
W,H,FPS,TILE=1280,720,60,48; WW,WH=200,15
GRAV=2200;JVEL=-680;SHOP=-420;MFALL=900;WALK=220;RUN=380
AG=35;AY=22;DG=28;DA=15;JBUF=0.12;JHOLD=0.15;COYOTE=0.10
DASH_SPEED=600;DASH_DURATION=0.3;DASH_COOLDOWN=1.0
SUMO_PUSH=800;SUMO_SHIELD=2.0;FOOTSTEP_GRD=0.16;FOOTSTEP_RUN=0.10
PW=36;PH_SMALL=40;PH_BIG=80;MAGNET_R=110;MAGNET_FORCE=1400
T_EMPTY=0;T_GROUND=1;T_BRICK=2;T_QUESTION=3;T_PIPE_L=4;T_PIPE_R=5
T_PIPE_TL=6;T_PIPE_TR=7;T_USED=8;T_DIRT=9;T_SPIKE=10;T_SPRING=11
T_FLAG=12;T_CHECKPOINT=13;T_PLATFORM=14;T_COIN=15
T_DASH=16;T_SHIELD=17;T_HARMONY=18
SOLID={T_GROUND,T_BRICK,T_QUESTION,T_PIPE_L,T_PIPE_R,T_PIPE_TL,T_PIPE_TR,T_USED,T_DIRT,T_PLATFORM}
MODE_SMALL=0;MODE_BIG=1;MODE_FIRE=2
SPARK_COLORS=[(255,220,0),(255,180,50),(255,150,100),(255,100,150),(200,100,255)]
HARMONY_COLORS=[(100,255,150),(150,255,100),(200,255,150),(100,200,255)]

# ═══ COLORS ═══
SKY=(92,148,252);BLK=(0,0,0);WHT=(255,255,255);RED=(200,30,30)
SKN=(248,184,120);BRN=(128,64,0);BLU=(30,60,200);GRN=(0,168,0)
YLW=(255,220,0);GRD=(200,76,12);BRC=(184,40,24);BLK2=(228,160,32)
GOM=(164,100,36);PIP=(0,168,0);PI2=(0,120,0);PIL=(100,220,100)
DUST=(232,216,184);PINK=(252,96,180);SHELL_GRN=(0,180,0);SHELL_BRN=(140,70,0)
FIRE_RED=(255,80,0);FIRE_YLW=(255,200,0);SPIKE_COL=(120,120,130)
SPRING_COL=(255,200,0);FLAG_COL=(0,200,0);COIN_GOLD=(255,215,0)
MUSHROOM_RED=(220,30,30);STAR_COLOR=(255,255,0);SHIELD_BLUE=(100,150,255)
DASH_ORANGE=(255,150,0);HARMONY_GREEN=(100,255,150);PEACE_PURPLE=(180,100,255)
BUDDY_PINK=(255,150,200);GLOW_CYAN=(100,255,255)

# ═══ TILE CACHE ═══
_tile_cache={}
def get_tile(k):
    if k in _tile_cache: return _tile_cache[k]
    t=None
    if k==0: t=None
    elif k==1: t=pygame.Surface((TILE,TILE));t.fill(GRD);pygame.draw.rect(t,(0,120,0),(0,0,TILE,6))
    elif k==2: t=pygame.Surface((TILE,TILE));t.fill(BRC)
    elif k==3: t=pygame.Surface((TILE,TILE));t.fill(BLK2);pygame.draw.rect(t,YLW,(TILE//2-6,TILE//4,12,12))
    elif k==4: t=pygame.Surface((TILE,TILE));t.fill(PIP);pygame.draw.rect(t,PIL,(0,0,TILE//6,TILE))
    elif k==5: t=pygame.Surface((TILE,TILE));t.fill(PIP);pygame.draw.rect(t,PI2,(TILE-TILE//6,0,TILE//6,TILE))
    elif k==6: t=pygame.Surface((TILE,TILE));t.fill(PIP);pygame.draw.rect(t,PIL,(0,0,TILE//6,TILE));pygame.draw.rect(t,(0,200,0),(0,0,TILE,8))
    elif k==7: t=pygame.Surface((TILE,TILE));t.fill(PIP);pygame.draw.rect(t,PI2,(TILE-TILE//6,0,TILE//6,TILE));pygame.draw.rect(t,(0,200,0),(0,0,TILE,8))
    elif k==8: t=pygame.Surface((TILE,TILE));t.fill((100,70,20))
    elif k==9: t=pygame.Surface((TILE,TILE));t.fill((140,100,20))
    elif k==10: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA)
    elif k==11: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);t.set_colorkey((0,0,0));pygame.draw.rect(t,SPRING_COL,(8,TILE-16,TILE-16,16))
    elif k==12: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);pygame.draw.rect(t,(150,150,150),(20,0,4,TILE));pygame.draw.polygon(t,FLAG_COL,[(24,4),(44,14),(24,24)])
    elif k==13: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);pygame.draw.rect(t,(100,100,100),(20,0,4,TILE));pygame.draw.polygon(t,YLW,[(24,0),(34,10),(24,20)])
    elif k==14: t=pygame.Surface((TILE,TILE));t.fill((100,100,180));pygame.draw.rect(t,(80,80,160),(2,2,TILE-4,TILE-4))
    elif k==15: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);t.set_colorkey((0,0,0));pygame.draw.circle(t,COIN_GOLD,(TILE//2,TILE//2),14)
    elif k==16: t=pygame.Surface((TILE,TILE));t.fill(DASH_ORANGE);pygame.draw.rect(t,(255,200,0),(4,4,TILE-8,TILE-8));pygame.draw.polygon(t,WHT,[(TILE//2,8),(TILE-8,TILE//2),(TILE//2,TILE-8),(8,TILE//2)])
    elif k==17: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);pygame.draw.circle(t,SHIELD_BLUE,(TILE//2,TILE//2),TILE//2-4);pygame.draw.circle(t,WHT,(TILE//2,TILE//2),TILE//4)
    elif k==18: t=pygame.Surface((TILE,TILE),pygame.SRCALPHA);pygame.draw.circle(t,HARMONY_GREEN,(TILE//2,TILE//2),TILE//2-2);pygame.draw.circle(t,WHT,(TILE//2,TILE//2),TILE//3)
    _tile_cache[k]=t; return t
# Pre-cache all tile surfaces at module load
for k in range(19):
    get_tile(k)

# Pre-cache all Mario sprites at module load
for b in [False, True]:
    for f in [False, True]:
        for p in range(4):
            get_mario(b, f, p)

print(f"Pre-cached {len(_tile_cache)} tile surfaces and {len(_mario_cache)} Mario sprites")

# ═══ SPRITES ═══
_mario_cache={}
def make_mario(big,fire,pose):
    h=TILE*2 if big else TILE;w=TILE;s=pygame.Surface((w,h),pygame.SRCALPHA)
    cap=(248,64,0) if fire else RED;body=WHT if fire else BLU
    if not big:
        pygame.draw.rect(s,SKN,(w//2-5,0,10,10));pygame.draw.rect(s,cap,(w//2-6,0,12,5))
        pygame.draw.rect(s,BRN,(w//2-4,7,6,2));pygame.draw.rect(s,BLK,(w//2+2,3,2,2))
        pygame.draw.rect(s,body,(w//2-5,10,10,12))
    else:
        pygame.draw.rect(s,SKN,(w//2-5,0,10,12));pygame.draw.rect(s,cap,(w//2-6,0,12,6))
        pygame.draw.rect(s,YLW,(w//2-1,2,2,2));pygame.draw.rect(s,BLK,(w//2+2,4,2,2))
        pygame.draw.rect(s,BRN,(w//2-3,9,6,2));pygame.draw.rect(s,body,(w//2-6,12,12,14))
        pygame.draw.rect(s,BRN,(w//2-5,24,10,2))
        if pose==3: pygame.draw.rect(s,body,(w//2-8,26,5,14));pygame.draw.rect(s,body,(w//2+3,26,5,14))
        elif pose==1: pygame.draw.rect(s,body,(w//2-7,26,5,14));pygame.draw.rect(s,body,(w//2+1,28,5,12))
        elif pose==2: pygame.draw.rect(s,body,(w//2-6,28,5,12));pygame.draw.rect(s,body,(w//2+1,26,5,14))
        else: pygame.draw.rect(s,body,(w//2-6,26,12,14))
        if pose in(1,2):
            if pose==1: pygame.draw.rect(s,body,(w//2-9,26,3,10));pygame.draw.circle(s,WHT,(w//2-8,33),2)
            else: pygame.draw.rect(s,body,(w//2+6,26,3,10));pygame.draw.circle(s,WHT,(w//2+7,33),2)
        else:
            pygame.draw.rect(s,body,(w//2-8,26,3,10));pygame.draw.circle(s,WHT,(w//2-7,33),2)
            pygame.draw.rect(s,body,(w//2+5,26,3,10));pygame.draw.circle(s,WHT,(w//2+7,33),2)
    return s
def get_mario(big,fire,pose):
    key=(big,fire,pose)
    if key not in _mario_cache: _mario_cache[key]=make_mario(big,fire,pose)
    return _mario_cache[key]
for b in[False,True]:
    for f in[False,True]:
        for p in range(4): get_mario(b,f,p)
HEART_F=pygame.Surface((22,20),pygame.SRCALPHA);pygame.draw.circle(HEART_F,RED,(6,7),5);pygame.draw.circle(HEART_F,RED,(16,7),5);pygame.draw.polygon(HEART_F,RED,[(1,8),(11,19),(21,8),(11,15)]);pygame.draw.circle(HEART_F,(252,180,180),(4,5),2)
HEART_E=pygame.Surface((22,20),pygame.SRCALPHA);pygame.draw.circle(HEART_E,(90,30,30),(6,7),5);pygame.draw.circle(HEART_E,(90,30,30),(16,7),5);pygame.draw.polygon(HEART_E,(90,30,30),[(1,8),(11,19),(21,8),(11,15)])

# ═══ COLLISION ═══
def player_tile_col(px,py,pw,ph,lvl,vy):
    hg=hc=hl=hr=False
    for ty in range(max(0,int(py//TILE)),min(WH-1,int((py+ph)//TILE))+1):
        for tx in range(max(0,int(px//TILE)),min(WW-1,int((px+pw)//TILE))+1):
            if lvl[ty][tx] in SOLID:
                ol=(px+pw)-tx*TILE;or_=(tx+1)*TILE-px;ot=(py+ph)-ty*TILE;ob=(ty+1)*TILE-py
                m=min(ol,or_,ot,ob)
                if m==ob and vy>=0: py=ty*TILE-ph;hg=True
                elif m==ot and vy<0: py=(ty+1)*TILE;hc=True
                elif m==ol: px=tx*TILE-pw;hl=True
                elif m==or_: px=(tx+1)*TILE;hr=True
    return px,py,hg,hc,hl,hr

# ═══ PARTICLES ═══
class ParticlePool:
    def __init__(self,max_n=1000): self.p=[];self.max_n=max_n
    def spawn(self,x,y,vx,vy,col,life,sz,kind='dust'):
        if len(self.p)<self.max_n: self.p.append({'x':x,'y':y,'vx':vx,'vy':vy,'c':col,'life':life,'mlife':life,'sz':sz,'kind':kind,'spin':random.random()*6.28 if kind=='coin' else 0,'rot':0,'rotSpd':(random.random()-0.5)*6})
    def spawn_spark(self,x,y,n=8):
        for _ in range(n): a=random.random()*math.pi*2;sp=100+random.random()*200;self.spawn(x,y,math.cos(a)*sp,math.sin(a)*sp-80,random.choice(SPARK_COLORS),0.3+random.random()*0.5,2+random.randint(0,4),'spark')
    def spawn_peace(self,x,y,n=12):
        for _ in range(n): a=random.random()*math.pi*2;sp=80+random.random()*150;self.spawn(x,y,math.cos(a)*sp,math.sin(a)*sp-60,random.choice([PEACE_PURPLE,BUDDY_PINK,(255,220,50),GLOW_CYAN]),0.4+random.random()*0.6,2+random.randint(0,5),'peace')
    def spawn_harmony(self,x,y,n=6):
        for _ in range(n): a=random.random()*math.pi*2;sp=50+random.random()*100;self.spawn(x,y,math.cos(a)*sp,math.sin(a)*sp-50,random.choice(HARMONY_COLORS),0.5+random.random()*0.5,3+random.randint(0,3),'harmony')
    def update(self,dt,px=0,py=0):
        alive=[];coins=0
        for p in self.p:
            if p['kind']=='coin':
                dx=px-p['x'];dy=(py-TILE//2)-p['y'];d=math.hypot(dx,dy)
                if d<MAGNET_R and d>1: f=MAGNET_FORCE*(1.0-d/MAGNET_R);p['vx']+=(dx/d)*f*dt;p['vy']+=(dy/d)*f*dt-300*dt
                else: p['vy']+=GRAV*0.6*dt
            else: p['vy']+=GRAV*0.5*dt
            p['x']+=p['vx']*dt;p['y']+=p['vy']*dt;p['life']-=dt;p['rot']+=p.get('rotSpd',0)*dt
            if p['life']<=0:
                if p['kind']=='coin': coins+=1
            else: alive.append(p)
        self.p=alive;return coins
    def draw(self,screen,cx):
        for p in self.p:
            t=p['life']/p['mlife'];sx=int(p['x']-cx);sy=int(p['y'])
            if p['kind']=='coin':
                spin=math.sin(p.get('spin',0)+p['mlife']*18);w=max(2,int(10*abs(spin)));pygame.draw.ellipse(screen,p['c'],(sx-w//2,sy-5,w,10))
            elif p['kind'] in('spark','peace','harmony'):
                sz=max(1,int(p['sz']*t*1.5));glow=pygame.Surface((sz*4,sz*4),pygame.SRCALPHA);pygame.draw.circle(glow,(*p['c'][:3],int(80*t)),(sz*2,sz*2),sz*2);screen.blit(glow,(sx-sz*2,sy-sz*2));pygame.draw.circle(screen,p['c'],(sx,sy),sz)
            else: sz=max(1,int(p['sz']*t));pygame.draw.circle(screen,p['c'],(sx,sy),sz)

# ═══ CAMERA ═══
class Camera:
    def __init__(self): self.x=0;self.y=0;self.lookahead=200;self.smooth=8.0;self.sz=0;self.sdur=0;self.st=0
    def shake(self,i,d): self.sz=i;self.sdur=d;self.st=0
    def update(self,px,pvx,dt,lw):
        d=1 if pvx>0 else-1 if pvx<0 else 0;t=px-W//3+self.lookahead*d;t=max(0,min(lw-W,t));self.x+=(t-self.x)*min(self.smooth*dt,1.0)
        ox=oy=0
        if self.st<self.sdur: self.st+=dt;p=self.st/self.sdur;dec=1-p;ox=math.sin(self.st*30)*self.sz*dec;oy=math.cos(self.st*25)*self.sz*dec
        return int(self.x+ox),int(self.y+oy)

# ═══ ENTITIES ═══
class Defender:
    TYPES={'goomba':{'w':40,'h':40,'speed':60,'score':100,'color':GOM},'koopa':{'w':40,'h':56,'speed':50,'score':200,'color':SHELL_GRN},'buddy':{'w':36,'h':36,'speed':80,'score':0,'color':BUDDY_PINK}}
    def __init__(self,x,y,dtype='goomba'):
        cfg=self.TYPES.get(dtype,self.TYPES['goomba']);self.x=x;self.y=y;self.w=cfg['w'];self.h=cfg['h'];self.vx=-cfg['speed'];self.vy=0;self.type=dtype;self.active=True;self.t=0;self.buddy=False;self.hp=1;self.shell_mode=False;self.cfg=cfg
    def update(self,dt,lvl):
        if not self.active: return
        self.t+=dt
        if self.buddy: return
        self.vy+=GRAV*dt;self.vy=min(self.vy,MFALL);self.x+=self.vx*dt
        cx=int((self.x+(self.w if self.vx>0 else 0))//TILE)
        for ty in range(int(self.y//TILE),int((self.y+self.h)//TILE)+1):
            if 0<=ty<WH and 0<=cx<WW and lvl[ty][cx] in SOLID: self.vx*=-1;break
        self.y+=self.vy*dt
        ty=int((self.y+self.h)//TILE)
        for tx in range(int(self.x//TILE),int((self.x+self.w)//TILE)+1):
            if 0<=ty<WH and 0<=tx<WW and lvl[ty][tx] in SOLID: self.y=ty*TILE-self.h;self.vy=0;break
        etx=int((self.x+(self.w if self.vx>0 else 0))//TILE);bty=int((self.y+self.h+4)//TILE)
        if 0<=bty<WH and 0<=etx<WW and lvl[bty][etx]==0: self.vx*=-1
        self.x=max(0,min(WW*TILE-self.w,self.x))
    def draw(self,screen,cx):
        if not self.active: return
        sx=int(self.x-cx);sy=int(self.y)
        if sx<-TILE*2 or sx>screen.get_width()+TILE*2: return
        if self.buddy:
            glow=pygame.Surface((48,48),pygame.SRCALPHA);pygame.draw.circle(glow,(*BUDDY_PINK,60),(24,24),24);screen.blit(glow,(sx-4,sy-self.h-4))
            pygame.draw.ellipse(screen,BUDDY_PINK,(sx,sy-self.h,self.w,self.h));pygame.draw.circle(screen,WHT,(sx+self.w//3,sy-self.h//2),3);pygame.draw.circle(screen,WHT,(sx+2*self.w//3,sy-self.h//2),3)
            pygame.draw.circle(screen,RED,(sx+self.w//2,sy-self.h-10),4)
        elif self.type=='goomba':
            pygame.draw.ellipse(screen,self.cfg['color'],(sx,sy-self.h//2,self.w,self.h));pygame.draw.rect(screen,self.cfg['color'],(sx+self.w//4,sy-self.h//3,self.w//2,self.h//3))
            pygame.draw.rect(screen,BLK,(sx+self.w//3,sy-self.h//3,self.w//6,self.h//8));pygame.draw.rect(screen,BLK,(sx+self.w//2,sy-self.h//3,self.w//6,self.h//8))
            of=4 if int(self.t*4)%2==0 else 0;pygame.draw.rect(screen,BLK,(sx+self.w//6+of,sy+self.h//2-4,self.w//3,self.h//6));pygame.draw.rect(screen,BLK,(sx+self.w//2-of,sy+self.h//2-4,self.w//3,self.h//6))
        elif self.type=='koopa':
            color=SHELL_BRN if self.shell_mode else self.cfg['color'];pygame.draw.ellipse(screen,color,(sx,sy-self.h,self.w,self.h));pygame.draw.rect(screen,WHT,(sx+4,sy-self.h+4,self.w-8,12))
            if not self.shell_mode: pygame.draw.rect(screen,BLK,(sx+self.w//3,sy-self.h//2,4,4));pygame.draw.rect(screen,BLK,(sx+self.w//2,sy-self.h//2,4,4))
        else: pygame.draw.rect(screen,self.cfg['color'],(sx,sy-self.h,self.w,self.h))
    def recruit(self):
        if self.buddy: return False
        self.buddy=True;self.type='buddy';self.vx=0;self.vy=0;self.w=36;self.h=36;return True
    def push(self,fx,fy,force=SUMO_PUSH): self.vx=fx*force*0.01;self.vy=fy*force*0.01-200
    def overlaps_rect(self,rx,ry,rw,rh): return self.x<rx+rw and self.x+self.w>rx and self.y<ry+rh and self.y+self.h>ry

class PowerUp:
    TYPES={'mushroom':{'w':36,'h':36,'color':MUSHROOM_RED,'score':1000},'star':{'w':36,'h':36,'color':STAR_COLOR,'score':2000},'fire_flower':{'w':36,'h':36,'color':FIRE_RED,'score':1000},'one_up':{'w':36,'h':36,'color':(0,200,0),'score':0},'shield':{'w':36,'h':36,'color':SHIELD_BLUE,'score':500},'harmony':{'w':36,'h':36,'color':HARMONY_GREEN,'score':1500}}
    def __init__(self,x,y,ptype='mushroom'):
        cfg=self.TYPES.get(ptype,self.TYPES['mushroom']);self.x=x;self.y=y;self.w=cfg['w'];self.h=cfg['h'];self.vx=80;self.vy=-200;self.type=ptype;self.cfg=cfg;self.active=True;self.t=0;self.emerge=True;self.emerge_y=y-TILE
    def update(self,dt,lvl):
        if not self.active: return
        self.t+=dt
        if self.emerge:
            self.y+=self.vy*dt
            if self.y<=self.emerge_y: self.y=self.emerge_y;self.emerge=False;self.vy=0
            return
        self.vy+=GRAV*dt;self.vy=min(self.vy,MFALL);self.x+=self.vx*dt
        cx=int((self.x+(self.w if self.vx>0 else 0))//TILE)
        for ty in range(int(self.y//TILE),int((self.y+self.h)//TILE)+1):
            if 0<=ty<WH and 0<=cx<WW and lvl[ty][cx] in SOLID: self.vx*=-1;break
        self.y+=self.vy*dt
        ty=int((self.y+self.h)//TILE)
        for tx in range(int(self.x//TILE),int((self.x+self.w)//TILE)+1):
            if 0<=ty<WH and 0<=tx<WW and lvl[ty][tx] in SOLID: self.y=ty*TILE-self.h;self.vy=0;break
    def draw(self,screen,cx):
        if not self.active: return
        sx=int(self.x-cx);sy=int(self.y)
        if sx<-TILE*2 or sx>screen.get_width()+TILE*2: return
        if self.type=='mushroom': pygame.draw.ellipse(screen,self.cfg['color'],(sx,sy-self.h,self.w,self.h*3//5));pygame.draw.rect(screen,(240,200,160),(sx+4,sy-self.h*2//5,self.w-8,self.h*2//5))
        elif self.type=='star':
            a=self.t*5;pts=[]
            for i in range(5): ang=a+i*2*math.pi/5-math.pi/2;r=self.w//2 if i%2==0 else self.w//4;pts.append((sx+self.w//2+r*math.cos(ang),sy-self.h//2+r*math.sin(ang)))
            pygame.draw.polygon(screen,self.cfg['color'],pts)
        elif self.type=='fire_flower': pygame.draw.ellipse(screen,(0,168,0),(sx+self.w//2-4,sy-self.h,8,self.h//2));pygame.draw.circle(screen,FIRE_RED,(sx+self.w//2,sy-self.h*3//4),10);pygame.draw.circle(screen,FIRE_YLW,(sx+self.w//2,sy-self.h*3//4),6)
        elif self.type=='shield': pygame.draw.circle(screen,self.cfg['color'],(sx+self.w//2,sy-self.h//2),self.w//2);pygame.draw.circle(screen,WHT,(sx+self.w//2,sy-self.h//2),self.w//3);pygame.draw.circle(screen,self.cfg['color'],(sx+self.w//2,sy-self.h//2),self.w//4)
        elif self.type=='harmony': pygame.draw.circle(screen,self.cfg['color'],(sx+self.w//2,sy-self.h//2),self.w//2);pygame.draw.circle(screen,WHT,(sx+self.w//2,sy-self.h//2),self.w//3)
        elif self.type=='one_up': pygame.draw.ellipse(screen,self.cfg['color'],(sx,sy-self.h,self.w,self.h));font=pygame.font.Font(None,20);screen.blit(font.render("1UP",True,WHT),(sx+4,sy-self.h+8))
        else: pygame.draw.ellipse(screen,self.cfg['color'],(sx,sy-self.h,self.w,self.h))
    def overlaps_rect(self,rx,ry,rw,rh): return self.x<rx+rw and self.x+self.w>rx and self.y<ry+rh and self.y+self.h>ry

class Fireball:
    def __init__(self,x,y,d): self.x=x;self.y=y;self.w=16;self.h=16;self.vx=300*d;self.vy=-400;self.active=True;self.t=0;self.bounces=0
    def update(self,dt,lvl):
        if not self.active: return
        self.t+=dt;self.vy+=GRAV*0.5*dt;self.x+=self.vx*dt;self.y+=self.vy*dt
        ty=int((self.y+self.h)//TILE);tx=int((self.x+self.w//2)//TILE)
        if 0<=ty<WH and 0<=tx<WW and lvl[ty][tx] in SOLID: self.vy=-350;self.bounces+=1
        if self.bounces>4: self.active=False
        if self.x<-200 or self.x>WW*TILE+200: self.active=False
    def draw(self,screen,cx):
        if not self.active: return
        sx=int(self.x-cx);sy=int(self.y);pygame.draw.circle(screen,FIRE_RED,(sx+8,sy+8),8);pygame.draw.circle(screen,FIRE_YLW,(sx+8,sy+8),5)
    def overlaps(self,other): return self.x<other.x+other.w and self.x+self.w>other.x and self.y<other.y+other.h and self.y+self.h>other.y

# ═══ LEVEL ═══
LVL1="""................................................................................
................................................................................
.......QQ.Q..QQ..................................................................
......BB.BBBB.BB................................................................
....................Q..Q........................................................
....................................BBBBB.......................................
.............BBBBBBB..BBBBB......................................................
................................................................................
................................................................................
.Q..........Q.Q.........BBBB..........Q..Q.Q.Q..........BBBB..........Q.Q......
BB.........BB.BB........BBBB.........BB.BB.BB.B........BBBB.........BB.BBB.....
................................................................................
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG"""
def parse_level(s):
    rows=[r for r in s.strip().split('\n') if r.strip()];lvl=[[0]*WW for _ in range(WH)]
    leg={'.':0,'G':1,'B':2,'Q':3,'P':4,'p':5,'T':6,'t':7,'U':8,'D':9,'S':10,'K':11,'F':12,'C':13,'M':14,'O':16,'H':17,'A':18}
    for y,row in enumerate(rows[-WH:]):
        for x,ch in enumerate(row[:WW]):
            if ch.upper() in leg: lvl[WH-1-y][x]=leg[ch.upper()]
            if ch=='g': lvl[WH-1-y][x]=1
    return lvl

# ═══ GAME ═══
class Game:
    def __init__(self):
        self.lvl=parse_level(LVL1);self.particles=ParticlePool(1000);self.camera=Camera()
        self.entities=[];self.cars=[]
        for _ in range(3): self.cars.append({'x':random.randint(50,WW-5)*TILE,'y':(WH-3)*TILE,'vx':30,'color':random.choice([(220,40,40),(40,100,220),(255,200,40)])})
        self.coins=0;self.score=0;self.time=400;self.lives=3;self.max_lives=3
        self.game_over=False;self.level_complete=False;self.paused=False
        self.hud_pulse=0.0;self.hud_flash=0.0;self.hud_score_pulse=0.0;self.hud_fade=0.0
        self.combo=0;self.combo_timer=0.0;self.buddies=0;self.harmony=0
        self.px=3*TILE;self.py=(WH-3)*TILE;self.pvx=0;self.pvy=0;self.p_dir=1;self.p_mode=MODE_SMALL
        self.p_inv=0;self.p_star=0;self.p_air=True;self.p_jmp=False;self.p_sq_y=1.0;self.p_sq_x=1.0
        self.p_coyote=0;self.p_jbuf=0;self.p_jhold=0;self.p_was_g=True;self.p_anim=0;self.p_step_t=0.0
        self.p_on_car=False;self.p_car=None;self.p_can_shoot=True
        self.dash_timer=0;self.dash_cooldown=0;self.shield_timer=0;self.dash_dir=0;self.is_dashing=False
        self._spawn()
    def _spawn(self):
        self.entities=[]
        for tx in range(WW):
            for ty in range(WH):
                if self.lvl[ty][tx]==9 and random.random()<0.3:
                    self.entities.append(Defender(tx*TILE,(ty-1)*TILE,random.choice(['goomba','goomba','koopa'])))
        for ex in[20,21,35,36,50,51,65,66,80,81]:
            if random.random()<0.7: self.entities.append(Defender(ex*TILE,(WH-3)*TILE,random.choice(['goomba','goomba','koopa'])))
    def run(self,dt,keys):
        if self.game_over or self.level_complete: self.hud_fade=max(0,self.hud_fade-dt*1.5);return
        if self.paused: return
        self.hud_fade=min(1.0,self.hud_fade+dt*1.5);self.hud_pulse=max(0,self.hud_pulse-dt*2.5)
        self.hud_flash=max(0,self.hud_flash-dt*3.0);self.hud_score_pulse=max(0,self.hud_score_pulse-dt*2.0)
        self.time-=dt;self.p_anim+=dt
        if self.p_star>0: self.p_star-=dt
        if self.p_inv>0: self.p_inv-=dt
        if self.combo_timer>0: self.combo_timer-=dt
        if self.combo_timer<=0: self.combo=0
        if self.dash_cooldown>0: self.dash_cooldown-=dt
        if self.dash_timer>0: self.dash_timer-=dt
        else: self.is_dashing=False
        if self.shield_timer>0: self.shield_timer-=dt
        ax=0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: ax=-1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: ax=1
        jmp=keys[pygame.K_SPACE] or keys[pygame.K_w] or keys[pygame.K_UP]
        run=keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        shoot=keys[pygame.K_x] or keys[pygame.K_RCTRL];dash=keys[pygame.K_LCTRL] or keys[pygame.K_z]
        spd=RUN if run else WALK;ph=PH_BIG if self.p_mode>0 else PH_SMALL;ground_y=(WH-3)*TILE-ph
        if dash and self.dash_cooldown<=0 and not self.is_dashing:
            self.is_dashing=True;self.dash_timer=DASH_DURATION;self.dash_cooldown=DASH_COOLDOWN;self.dash_dir=ax if ax!=0 else self.p_dir;self.pvx=DASH_SPEED*self.dash_dir
            self.particles.spawn_spark(self.px,self.py-ph//2,12);self.camera.shake(4,0.2)
        if self.is_dashing: self.pvx=DASH_SPEED*self.dash_dir
        else:
            self.p_air=self.py<ground_y
            if ax:
                accel=AG if not self.p_air else AY*0.6;self.pvx+=(ax*spd-self.pvx)*min(accel*dt,1.0);self.p_dir=1 if ax>0 else 0
            else:
                if not self.p_air: self.pvx*=max(0,1-DG*dt)
                else: self.pvx*=max(0,1-DA*dt)
                if abs(self.pvx)<5: self.pvx=0
        if self.p_air: self.p_coyote=max(0,self.p_coyote-dt)
        else: self.p_coyote=COYOTE
        if jmp: self.p_jbuf=JBUF
        else: self.p_jbuf=max(0,self.p_jbuf-dt)
        can_jmp=not self.p_air or self.p_coyote>0
        if self.p_jbuf>0 and can_jmp and not self.p_jmp:
            self.pvy=JVEL if jmp else SHOP;self.p_jmp=True;self.p_coyote=0;self.p_jbuf=0;self.p_jhold=0;self.p_sq_y=0.7;self.p_sq_x=1.3
            if not self.p_on_car:
                for _ in range(6): self.particles.spawn(self.px+random.uniform(-10,10),ground_y,random.uniform(-90,90),random.uniform(-60,10),DUST,random.uniform(0.25,0.55),random.randint(4,8))
        if self.p_jmp and jmp and self.pvy<0: self.p_jhold+=dt;self.pvy+=GRAV*(0.4 if self.p_jhold<JHOLD else 1.0)*dt
        elif self.p_air: self.pvy+=GRAV*dt
        self.pvy=min(self.pvy,MFALL)
        self.px+=self.pvx*dt;self.px,self.py,hg,hc,hl,hr=player_tile_col(self.px,self.py,PW,ph,self.lvl,self.pvy)
        if hg: self.pvy=0;self.p_jmp=False
        if hc: self.pvy=50
        self.py+=self.pvy*dt;self.px,self.py,hg,hc,hl,hr=player_tile_col(self.px,self.py,PW,ph,self.lvl,self.pvy)
        if hg and not self.p_was_g and self.pvy>200:
            imp=min(self.pvy/800,1.0);self.p_sq_y=1.0+imp*0.4;self.p_sq_x=1.0-imp*0.25
            if not self.p_on_car:
                for _ in range(int(6*(0.6+0.6*imp))): self.particles.spawn(self.px+random.uniform(-10,10),ground_y,random.uniform(-90,90)*imp,random.uniform(-60,10),DUST,random.uniform(0.25,0.55),random.randint(4,8))
            self.camera.shake(imp*3,0.15)
        if hg: self.pvy=0;self.p_jmp=False;self.p_was_g=True
        else: self.p_was_g=False
        if not self.p_air and not self.p_on_car and abs(self.pvx)>40:
            cadence=FOOTSTEP_RUN if(run and abs(self.pvx)>WALK*0.95) else FOOTSTEP_GRD;self.p_step_t+=dt
            if self.p_step_t>=cadence:
                self.p_step_t=0
                for _ in range(2): self.particles.spawn(self.px+(-10 if self.p_dir<1 else 10)+random.uniform(-4,4),ground_y+random.uniform(-3,2),random.uniform(-25,25)+(-self.p_dir*40),random.uniform(-15,5),DUST,random.uniform(0.18,0.35),random.randint(2,4))
        else: self.p_step_t=FOOTSTEP_GRD*0.5
        self.p_sq_y+=(1-self.p_sq_y)*15*dt;self.p_sq_x+=(1-self.p_sq_x)*15*dt;self.px=max(0,min(WW*TILE-PW,self.px))
        htx=int(self.px//TILE);hty=int((self.py-ph)//TILE)
        if 0<=htx<WW and 0<=hty<WH:
            ht=self.lvl[hty][htx]
            if ht in SOLID and self.py-ph<hty*TILE:
                self.pvy=50
                if ht==3: self.coins+=1;self.score+=200;self.lvl[hty][htx]=8
                elif ht==15: self.coins+=1;self.score+=200;self.lvl[hty][htx]=0;self.hud_pulse=1.0
                elif ht==17: self.shield_timer=SUMO_SHIELD;self.particles.spawn_peace(self.px,self.py-ph,8);self.hud_pulse=1.0
                elif ht==18: self.harmony+=1;self.score+=500;self.particles.spawn_harmony(self.px,self.py-ph,10);self.lvl[hty][htx]=0;self.hud_pulse=1.0
                if ht==3:
                    if self.p_mode==MODE_SMALL: self.entities.append(PowerUp(htx*TILE,(hty-1)*TILE,'mushroom'))
                    else: self.entities.append(PowerUp(htx*TILE,(hty-1)*TILE,'fire_flower'))
                    for _ in range(6): self.particles.spawn(htx*TILE+TILE//2+random.uniform(-8,8),hty*TILE+random.uniform(-4,4),random.uniform(-60,60),-260,YLW,0.7,10,'coin',0.6)
                    self.hud_pulse=1.0;self.hud_score_pulse=1.0
        if shoot and self.p_mode==MODE_FIRE and self.p_can_shoot:
            self.p_can_shoot=False;self.entities.append(Fireball(self.px+(PW if self.p_dir==1 else -16),self.py-ph//2,1 if self.p_dir==1 else -1))
        if not shoot: self.p_can_shoot=True
        for e in self.entities:
            if isinstance(e,(Defender,PowerUp,Fireball)): e.update(dt,self.lvl)
        pr=(self.px,self.py-ph,PW,ph)
        for e in self.entities:
            if not e.active: continue
            if isinstance(e,Defender) and not e.buddy and e.overlaps_rect(*pr):
                if self.is_dashing:
                    dx=e.x-self.x;dy=e.y-self.y;d=max(math.hypot(dx,dy),1);e.push(dx/d,dy/d);self.particles.spawn_peace(e.x,e.y-e.h//2,8);self.score+=50;self.combo+=1;self.combo_timer=2.0;self.camera.shake(3,0.15)
                elif self.shield_timer>0:
                    dx=e.x-self.x;dy=e.y-self.y;d=max(math.hypot(dx,dy),1);e.push(dx/d,dy/d,SUMO_PUSH*0.5);self.particles.spawn_spark(e.x,e.y-e.h//2,6)
                elif self.pvy>0 and self.py<e.y-e.h//2:
                    e.recruit();self.pvy=JVEL*0.6;self.score+=e.cfg['score'];self.buddies+=1;self.combo+=1;self.combo_timer=2.0;self.particles.spawn_peace(e.x,e.y-e.h//2,12);self.camera.shake(3,0.2)
                elif self.p_star>0 or self.p_inv>0: e.active=False;self.score+=e.cfg['score'];self.particles.spawn_spark(e.x,e.y-e.h//2,6)
                else:
                    if self.p_mode>0: self.p_mode=MODE_SMALL;self.p_inv=2.0
                    else: self.lives-=1;self.hud_flash=1.0;self.camera.shake(8,0.5)
                    if self.lives<=0: self.game_over=True
            elif isinstance(e,Defender) and e.buddy:
                tx=self.px+(24 if self.p_dir==1 else -24);ty=self.py-PH_SMALL;e.x+=(tx-e.x)*5*dt;e.y+=(ty-e.y)*5*dt;self.score+=int(dt*2)
            elif isinstance(e,PowerUp) and e.overlaps_rect(*pr):
                e.active=False
                if e.type=='mushroom':
                    if self.p_mode==MODE_SMALL: self.p_mode=MODE_BIG;self.py-=TILE
                    self.score+=e.cfg['score']
                elif e.type=='fire_flower': self.p_mode=MODE_FIRE;self.score+=e.cfg['score']
                elif e.type=='star': self.p_star=10.0;self.score+=e.cfg['score']
                elif e.type=='one_up': self.lives=min(self.lives+1,self.max_lives)
                elif e.type=='shield': self.shield_timer=SUMO_SHIELD*2;self.score+=e.cfg['score']
                elif e.type=='harmony': self.harmony+=1;self.score+=1500
                self.hud_pulse=1.0;self.hud_score_pulse=1.0;self.particles.spawn_harmony(self.px,self.py-ph,8)
            elif isinstance(e,Fireball):
                for e2 in self.entities:
                    if isinstance(e2,Defender) and not e2.buddy and e2.active and e.overlaps(e2):
                        e.active=False;e2.active=False;self.score+=e2.cfg['score'];self.camera.shake(4,0.2)
                        for _ in range(6): self.particles.spawn(e.x,e.y,random.uniform(-120,120),random.uniform(-200,-30),FIRE_RED,random.uniform(0.3,0.6),random.randint(3,7),'explosion',0.3)
                        break
        self.entities=[e for e in self.entities if e.active]
        collected=self.particles.update(dt,self.px,self.py);self.coins+=collected;self.score+=collected*50
        for c in self.cars: c['x']+=c['vx']*dt
        if keys[pygame.K_f]:
            if self.p_on_car: self.p_on_car=False;self.p_car=None
            else:
                for c in self.cars:
                    if abs(c['x']-self.px)<TILE*2 and abs(c['y']-self.py)<TILE*2: self.p_on_car=True;self.p_car=c;break
        if self.p_on_car and self.p_car:
            c=self.p_car;self.px=c['x'];self.py=c['y']-ph
            if keys[pygame.K_d]: c['vx']=min(c['vx']+200*dt,400)
            elif keys[pygame.K_a]: c['vx']=max(c['vx']-200*dt,-200)
            else: c['vx']*=max(0,1-3*dt)
        self.camera.update(self.px,self.pvx,dt,WW*TILE)
        if self.time<=0: self.lives-=1;self.hud_flash=1.0;self.time=400
        if self.lives<=0: self.game_over=True
    def draw(self,screen):
        cx,cy=int(self.camera.x),int(self.camera.y)
        for b in range(4):
            r=b/4;screen.fill((int(92+(180-92)*r),int(148+(220-148)*r),int(252+(255-252)*r)),(0,b*H//4,W,H//4+1))
        stx=max(0,cx//TILE-1);etx=min(WW,cx//TILE+W//TILE+2)
        for tx in range(stx,etx):
            for ty in range(WH):
                t=self.lvl[ty][tx]
                if t==0: continue
                ts=get_tile(t)
                if ts: sx=tx*TILE-cx;screen.blit(ts,(sx,ty*TILE))
        for e in self.entities:
            if isinstance(e,(Defender,PowerUp,Fireball)): e.draw(screen,cx)
        self.particles.draw(screen,cx)
        for c in self.cars:
            sx=int(c['x']-cx)
            if -TILE*2<sx<W+TILE*2:
                pygame.draw.rect(screen,c['color'],(sx,c['y']-TILE//2,TILE*2,TILE//2));pygame.draw.rect(screen,(60,60,70),(sx+TILE//2,c['y']-TILE,TILE,TILE//2));pygame.draw.rect(screen,(150,200,240),(sx+TILE//2+4,c['y']-TILE+4,TILE-8,TILE//3))
                pygame.draw.circle(screen,(30,30,30),(sx+TILE//3,c['y']),TILE//4);pygame.draw.circle(screen,(30,30,30),(sx+TILE*5//3,c['y']),TILE//4)
        if not self.p_on_car:
            sx=int(self.px-cx);sy=int(self.py);ph=PH_BIG if self.p_mode>0 else PH_SMALL
            big=self.p_mode>0;fire=self.p_mode==MODE_FIRE
            if self.p_air: pose=3
            elif abs(self.pvx)>20: pose=1 if int(self.p_anim*8)%2==0 else 2
            else: pose=0
            spr=get_mario(big,fire,pose);sw2=max(1,int(spr.get_width()*self.p_sq_x));sh2=max(1,int(spr.get_height()*self.p_sq_y))
            if abs(self.p_sq_x-1.0)>0.02 or abs(self.p_sq_y-1.0)>0.02: spr=pygame.transform.scale(spr,(sw2,sh2))
            if not self.p_dir: spr=pygame.transform.flip(spr,True,False)
            if self.p_inv>0 and int(self.p_inv*12)%2==0: spr=spr.copy();spr.set_alpha(110)
            if self.p_star>0: tint=(int(128+127*math.sin(self.p_anim*16)),int(128+127*math.sin(self.p_anim*16+2.1)),int(128+127*math.sin(self.p_anim*16+4.2)));spr=spr.copy();spr.fill(tint+(0,),None,pygame.BLEND_RGB_MULT)
            if self.shield_timer>0: glow=pygame.Surface((sw2+16,sh2+16),pygame.SRCALPHA);pygame.draw.circle(glow,(*SHIELD_BLUE,int(60+40*math.sin(self.p_anim*10))),(sw2//2+8,sh2//2+8),max(sw2,sh2)//2+8);screen.blit(glow,(sx-sw2//2-8,sy-sh2-8))
            if self.is_dashing:
                for i in range(3): trail=pygame.Surface((sw2,sh2),pygame.SRCALPHA);trail.blit(spr,(0,0));trail.set_alpha(80-i*25);screen.blit(trail,(sx-sw2//2-self.dash_dir*(i+1)*12,sy-sh2))
            screen.blit(spr,(sx-sw2//2,sy-sh2))
        self._draw_hud(screen)
        if self.game_over: ov=pygame.Surface((W,H),pygame.SRCALPHA);ov.fill((0,0,0,int(140*(1-self.hud_fade))));screen.blit(ov,(0,0));font=pygame.font.Font(None,72);go=font.render("GAME OVER",True,RED);screen.blit(go,(W//2-go.get_width()//2,H//2-30))
    def _draw_hud(self,screen):
        font=pygame.font.Font(None,36);med=pygame.font.Font(None,28)
        pulse=1.0+self.hud_pulse*0.08;bg_h=int(50*pulse);bg=pygame.Surface((W,bg_h),pygame.SRCALPHA);bg.fill((0,0,0,min(220,int(120+60*self.hud_pulse))));screen.blit(bg,(0,0))
        if self.hud_flash>0: ov=pygame.Surface((W,H),pygame.SRCALPHA);ov.fill((220,40,40,int(120*self.hud_flash)));screen.blit(ov,(0,0))
        pygame.draw.circle(screen,YLW,(34,30),9);pygame.draw.circle(screen,(255,240,140),(31,27),3)
        if self.hud_pulse>0: pygame.draw.circle(screen,YLW,(34,30),int(11+self.hud_pulse*4),2)
        screen.blit(med.render(f"x{self.coins:03d}",True,YLW),(50,15))
        sc=int(255+255*self.hud_score_pulse);screen.blit(med.render(f"SCORE:{self.score:06d}",True,(min(255,sc),min(255,int(220+35*self.hud_score_pulse)),min(255,100))),(150,15))
        title=font.render("SUPER MARIO GTA6",True,YLW)
        if self.hud_fade<1.0: title=title.copy();title.set_alpha(int(255*self.hud_fade))
        sh=font.render("SUPER MARIO GTA6",True,BLK);sh=sh.copy();sh.set_alpha(int(160*self.hud_fade))
        tx=W//2-title.get_width()//2;screen.blit(sh,(tx+2,12));screen.blit(title,(tx,10))
        tc=RED if self.time<30 else WHT
        if self.time<30 and int(self.time*6)%2==0: tc=YLW
        screen.blit(med.render(f"TIME:{int(self.time)}",True,tc),(W-260,15))
        for i in range(self.max_lives):
            h=HEART_F if i<self.lives else HEART_E;yo=int(math.sin(self.p_anim*2+i*0.7)*1.5)
            sx=int(math.sin(self.p_anim*60+i)*3*self.hud_flash) if self.hud_flash>0 else 0
            screen.blit(h,(W-100+i*26+sx,16+yo))
        screen.blit(med.render(f"x{self.lives}",True,WHT),(W-22,15))
        if self.combo>1: screen.blit(font.render(f"COMBO x{self.combo}!",True,YLW),(W//2-60,60))
        if self.buddies>0: screen.blit(med.render(f"BUDDIES:{self.buddies}",True,BUDDY_PINK),(W-150,45))
        if self.harmony>0: screen.blit(med.render(f"HARMONY:{self.harmony}",True,HARMONY_GREEN),(W-150,65))
        if self.dash_cooldown>0: pct=1.0-self.dash_cooldown/DASH_COOLDOWN;pygame.draw.rect(screen,(60,60,60),(10,H-20,100,12));pygame.draw.rect(screen,DASH_ORANGE,(10,H-20,int(100*pct),12))
        else: pygame.draw.rect(screen,DASH_ORANGE,(10,H-20,100,12));screen.blit(med.render("DASH [Z]",True,WHT),(10,H-35))
        if self.shield_timer>0: pygame.draw.rect(screen,SHIELD_BLUE,(120,H-20,int(80*self.shield_timer/SUMO_SHIELD),12));screen.blit(med.render("SHIELD",True,WHT),(120,H-35))

def main():
    try:
        pygame.init();screen=pygame.display.set_mode((W,H));pygame.display.set_caption('Super Mario GTA6 V4.0.0 Ethics-First')
        clock=pygame.time.Clock();game=Game();print("SUPER MARIO GTA6 V4.0.0 — Ethics-First Engine Starting",flush=True)
        running=True
        while running:
            dt=clock.tick(FPS)/1000.0;dt=min(dt,0.05)
            for ev in pygame.event.get():
                if ev.type==pygame.QUIT: running=False
                if ev.type==pygame.KEYDOWN and ev.key==pygame.K_ESCAPE: running=False
                if ev.type==pygame.KEYDOWN and ev.key==pygame.K_p: game.paused=not game.paused
            keys=pygame.key.get_pressed();game.run(dt,keys);game.draw(screen);pygame.display.flip()
    except Exception as e: print(f"ERROR:{e}",flush=True);traceback.print_exc()
    finally: pygame.quit();print("GAME EXITED",flush=True)
if __name__=='__main__': main()
