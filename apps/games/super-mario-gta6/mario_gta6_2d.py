"""
SUPER MARIO BROS 2D — V1.4.0 Nano Engine (Audit Roadmap Pass 1)
~520 lines. Pre-rendered sprites, tile culling, particle system.
+ Footstep dust, jump/landing clouds, coin magnet, hearts HUD, HUD pulses.

SPDX-License-Identifier: MIT
Copyright (c) 2026 Hazem Soussi (HA)
<https://github.com/hazem-soussi-HA>

This is an unofficial, non-commercial fan project. It is not
affiliated with, endorsed by, or sponsored by Nintendo Co., Ltd.
or Take-Two Interactive Software, Inc. / Rockstar Games, Inc.
See ../../TRADEMARKS.md and ../../NOTICE_TO_IP_HOLDERS.md for
the full attribution and pre-partnership statement.

Controls: A/D=move, W/Space/Up=jump, Shift=run, F=car, Esc=quit
"""
import os,math,random,traceback
os.environ['PYGAME_HIDE_SUPPORT_PROMPT']='1';os.environ['SDL_AUDIODRIVER']='disk'
import pygame

# ═══ CONSTANTS ═══
W,H,FPS,T=1280,720,60,48
WW,WH=200,15
GRAV=2200;JVEL=-680;SHOP=-420;MFALL=900
WALK=220;RUN=380
AG=35;AY=22;DG=28;DA=15
JBUF=0.12;JHOLD=0.15;COYOTE=0.10

# Coin magnet range (pixels)
MAGNET_R = 110
MAGNET_FORCE = 1400

# Footstep cadence (seconds)
FOOTSTEP_GRD = 0.16
FOOTSTEP_RUN = 0.10

# Colors
SKY=(92,148,252);BLK=(0,0,0);WHT=(255,255,255)
RED=(200,30,30);SKN=(248,184,120);BRN=(128,64,0)
BLU=(30,60,200);GRN=(0,168,0);YLW=(255,220,0)
GRD=(200,76,12);BRC=(184,40,24);BLK2=(228,160,32)
GOM=(164,100,36);PIP=(0,168,0);PI2=(0,120,0);PIL=(100,220,100)
DUST=(232,216,184);PINK=(252,96,180)


# ═══ TILE CACHE ═══
_tile_cache={}
def get_tile(k):
    if k in _tile_cache: return _tile_cache[k]
    if k==0: t=None
    elif k==1:
        t=pygame.Surface((T,T));t.fill(GRD)
        pygame.draw.rect(t,(0,120,0),(0,0,T,6))
        pygame.draw.rect(t,(152,56,0),(8,16,16,16))
    elif k==2:
        t=pygame.Surface((T,T));t.fill(BRC)
        for i in range(4): pygame.draw.line(t,(136,28,16),(0,i*12+12),(T,i*12+12),2)
    elif k==3:
        t=pygame.Surface((T,T));t.fill(BLK2)
        pygame.draw.rect(t,(180,120,24),(2,2,T-4,T-4))
        pygame.draw.rect(t,YLW,(T//2-6,T//4,12,12))
    elif k==9:
        t=pygame.Surface((T,T));t.fill((140,100,20))
    elif k in (4,6):
        t=pygame.Surface((T,T));t.fill(PIP)
        pygame.draw.rect(t,PIL,(0,0,T//6,T))
    elif k in (5,7):
        t=pygame.Surface((T,T));t.fill(PIP)
        pygame.draw.rect(t,PI2,(T-T//6,0,T//6,T))
    else: t=None
    _tile_cache[k]=t; return t

for k in [1,2,3,4,5,6,7,9]: get_tile(k)


# ═══ HEART SPRITE (procedural) ═══
def make_heart(filled=True):
    s=pygame.Surface((22,20),pygame.SRCALPHA)
    col=RED if filled else (90,30,30)
    pygame.draw.circle(s,col,(6,7),5)
    pygame.draw.circle(s,col,(16,7),5)
    pts=[(1,8),(11,19),(21,8),(11,15)]
    pygame.draw.polygon(s,col,pts)
    if filled:
        # small highlight
        pygame.draw.circle(s,(252,180,180),(4,5),2)
    return s

HEART_F=make_heart(True)
HEART_E=make_heart(False)


# ═══ MARIO SPRITES ═══
def make_mario(big, sm, pose):
    h=T*2 if big else T; w=T
    s=pygame.Surface((w,h),pygame.SRCALPHA)
    cap=(248,64,0) if sm else RED; body=WHT if sm else BLU
    if not big:
        pygame.draw.rect(s,SKN,(w//2-5,0,10,10))
        pygame.draw.rect(s,cap,(w//2-6,0,12,5))
        pygame.draw.rect(s,BRN,(w//2-4,7,6,2))
        pygame.draw.rect(s,BLK,(w//2+2,3,2,2))
        pygame.draw.rect(s,body,(w//2-5,10,10,12))
    else:
        pygame.draw.rect(s,SKN,(w//2-5,0,10,12))
        pygame.draw.rect(s,cap,(w//2-6,0,12,6))
        pygame.draw.rect(s,YLW,(w//2-1,2,2,2))
        pygame.draw.rect(s,BLK,(w//2+2,4,2,2))
        pygame.draw.rect(s,BRN,(w//2-3,9,6,2))
        pygame.draw.rect(s,body,(w//2-6,12,12,14))
        pygame.draw.rect(s,BRN,(w//2-5,24,10,2))
        if pose==3:
            pygame.draw.rect(s,body,(w//2-8,26,5,14))
            pygame.draw.rect(s,body,(w//2+3,26,5,14))
        elif pose==1:
            pygame.draw.rect(s,body,(w//2-7,26,5,14))
            pygame.draw.rect(s,body,(w//2+1,28,5,12))
        elif pose==2:
            pygame.draw.rect(s,body,(w//2-6,28,5,12))
            pygame.draw.rect(s,body,(w//2+1,26,5,14))
        else:
            pygame.draw.rect(s,body,(w//2-6,26,12,14))
        if pose in(1,2):
            if pose==1:
                pygame.draw.rect(s,body,(w//2-9,26,3,10))
                pygame.draw.circle(s,WHT,(w//2-8,33),2)
            else:
                pygame.draw.rect(s,body,(w//2+6,26,3,10))
                pygame.draw.circle(s,WHT,(w//2+7,33),2)
        else:
            pygame.draw.rect(s,body,(w//2-8,26,3,10))
            pygame.draw.circle(s,WHT,(w//2-7,33),2)
            pygame.draw.rect(s,body,(w//2+5,26,3,10))
            pygame.draw.circle(s,WHT,(w//2+7,33),2)
    return s

_mario_cache={}
def get_mario(big,sm,pose):
    key=(big,sm,pose)
    if key not in _mario_cache:
        _mario_cache[key]=make_mario(big,sm,pose)
    return _mario_cache[key]

for b in [False,True]:
    for s in [False,True]:
        for p in range(4):
            get_mario(b,s,p)


# ═══ LEVEL ═══
LVL="""
................................................................................
................................................................................
.......QQ.Q..QQ................................................................
......BB.BBBB.BB................................................................
....................Q..Q........................................................
....................................BBBBB.......................................
.............BBBBBBB..BBBBB.....................................................
................................................................................
................................................................................
................................................................................
.Q..........Q.Q.........BBBB..........Q..Q.Q.Q..........BBBB..........Q.Q......
BB.........BB.BB........BBBB.........BB.BB.BB.B........BBBB.........BB.BBB.....
................................................................................
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
"""

def parse_level(s):
    rows=[r for r in s.strip().split('\n') if r.strip()]
    lvl=[[0]*WW for _ in range(WH)]
    leg={'.':0,'G':1,'B':2,'Q':3}
    for y,row in enumerate(rows[-WH:]):
        for x,ch in enumerate(row[:WW]):
            if ch.upper() in leg: lvl[WH-1-y][x]=leg[ch.upper()]
            if ch=='g': lvl[WH-1-y][x]=1
    return lvl


# ═══ PARTICLE POOL ═══
def spawn_dust(x,y,n=6,spread=80,vy0=-40,vx0=0,col=DUST,sz=(3,7),life=(0.25,0.55)):
    """Spawn n dust particles at (x,y)."""
    for _ in range(n):
        return _pusher(x,y,
                       random.uniform(-spread,spread)+vx0,
                       random.uniform(vy0-20,vy0+20),
                       col, random.uniform(*life), random.randint(*sz))

def _pusher(x,y,vx,vy,col,life,sz):
    return {'x':x,'y':y,'vx':vx,'vy':vy,'c':col,'life':life,'mlife':life,'sz':sz,
            'kind':'dust','gravity':0.4}

def spawn_coin_anim(x,y):
    """Spawn a coin particle that pops up then magnetizes toward player."""
    return {'x':x,'y':y,'vx':random.uniform(-60,60),'vy':-260,
            'c':YLW,'life':0.7,'mlife':0.7,'sz':10,
            'kind':'coin','gravity':0.6,'spin':random.random()*6.28}


# ═══ GAME ═══
class Game:
    def __init__(self):
        self.lvl=parse_level(LVL)
        self.particles=[]
        self.t_enemies=[]
        self.coins=0; self.score=0; self.time=400; self.lives=3
        self.max_lives=3
        self.game_over=False

        # HUD anim state
        self.hud_pulse=0.0   # coin pickup pulse
        self.hud_flash=0.0   # damage flash
        self.hud_score_pulse=0.0
        self.hud_fade=1.0    # title fade-in

        self.px=3*T; self.py=(WH-3)*T
        self.pvx=0; self.pvy=0
        self.p_dir=1
        self.p_mode=0
        self.p_inv=0; self.p_star=0
        self.p_air=True; self.p_jmp=False
        self.p_sq_y=1.0; self.p_sq_x=1.0
        self.p_coyote=0; self.p_jbuf=0; self.p_jhold=0
        self.p_was_g=True; self.p_anim=0
        self.p_step_t=0.0
        self.p_on_car=False; self.p_car=None

        self.cars=[self._make_car(random.randint(50,WW-5)*T) for _ in range(3)]
        for ex in [20,21,35,36,50,51,65,66,80,81]:
            e={'x':ex*T,'y':(WH-3)*T,'vx':-random.randint(40,80),'t':0,'hp':1,'type':'goomba'}
            self.t_enemies.append(e)

        self.cam=0

    def _make_car(self,x):
        colors=[(220,40,40),(40,100,220),(255,200,40),(40,180,80),(180,60,180)]
        return {'x':x,'y':(WH-3)*T,'vx':30,'color':random.choice(colors)}

    def spawn_parts(self,x,y,col,n=5):
        for _ in range(n):
            self.particles.append(
                {'x':x,'y':y,
                 'vx':random.uniform(-150,150),
                 'vy':random.uniform(-300,-50),
                 'c':col,'life':random.uniform(0.3,0.8),
                 'mlife':0.8,'sz':random.randint(3,8),
                 'kind':'burst','gravity':0.5}
            )

    def spawn_dust_puff(self,x,y,intensity=1.0):
        """Used for jump takeoff + landing."""
        n=int(8*intensity)
        for _ in range(n):
            self.particles.append({
                'x':x+random.uniform(-10,10),
                'y':y+random.uniform(-4,2),
                'vx':random.uniform(-90,90)*intensity,
                'vy':random.uniform(-60,10),
                'c':DUST,
                'life':random.uniform(0.25,0.55),
                'mlife':0.55,
                'sz':random.randint(4,8),
                'kind':'dust',
                'gravity':0.25
            })

    def spawn_step(self,x,y,facing):
        """Single footstep puff behind/below the player."""
        ox=-10 if facing<0 else 10
        for _ in range(2):
            self.particles.append({
                'x':x+ox+random.uniform(-4,4),
                'y':y+random.uniform(-3,2),
                'vx':random.uniform(-25,25)+(-facing*40),
                'vy':random.uniform(-15,5),
                'c':DUST,
                'life':random.uniform(0.18,0.35),
                'mlife':0.35,
                'sz':random.randint(2,4),
                'kind':'dust',
                'gravity':0.20
            })

    def tile(self,tx,ty):
        if 0<=tx<WW and 0<=ty<WH: return self.lvl[ty][tx]
        return 1

    def solid(self,t): return t in (1,2,3,4,5,6,7,9)

    def run(self,dt,keys):
        if self.game_over:
            self.hud_fade=max(0,self.hud_fade-dt*1.5)
            return
        self.hud_fade=min(1.0,self.hud_fade+dt*1.5)
        self.hud_pulse=max(0,self.hud_pulse-dt*2.5)
        self.hud_flash=max(0,self.hud_flash-dt*3.0)
        self.hud_score_pulse=max(0,self.hud_score_pulse-dt*2.0)
        self.time-=dt; self.p_anim+=dt
        if self.p_star>0: self.p_star-=dt
        if self.p_inv>0: self.p_inv-=dt

        # Input
        ax=0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]: ax=-1
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]: ax=1
        jmp=keys[pygame.K_SPACE] or keys[pygame.K_w] or keys[pygame.K_UP]
        run=keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        spd=RUN if run else WALK

        g=(WH-3)*T-2
        self.p_air=self.py<g

        # ── Acceleration (snappy, Mario-authentic) ──
        # No more sluggish 0.1 multiplier. Direct lerp, with air control
        # dampened by 60% so jumps feel arc-y and weighted.
        if ax:
            accel = AG if (not self.p_air) else AY*0.6
            self.pvx += (ax*spd - self.pvx) * min(accel*dt, 1.0)
            self.p_dir = 1 if ax>0 else 0
        else:
            if not self.p_air:
                self.pvx *= max(0, 1-DG*dt)
            else:
                self.pvx *= max(0, 1-DA*dt)
            if abs(self.pvx)<5: self.pvx=0

        # Coyote
        if self.p_air: self.p_coyote=max(0,self.p_coyote-dt)
        else: self.p_coyote=COYOTE

        # Jump buffer
        if jmp: self.p_jbuf=JBUF
        else: self.p_jbuf=max(0,self.p_jbuf-dt)

        can_jmp=not self.p_air or self.p_coyote>0
        if self.p_jbuf>0 and can_jmp and not self.p_jmp:
            self.pvy=JVEL if jmp else SHOP
            self.p_jmp=True; self.p_coyote=0; self.p_jbuf=0; self.p_jhold=0
            self.p_sq_y=0.7; self.p_sq_x=1.3
            # Jump takeoff dust
            if not self.p_on_car:
                self.spawn_dust_puff(self.px, g, intensity=1.0)

        # Gravity
        if self.p_jmp and jmp and self.pvy<0:
            self.p_jhold+=dt
            self.pvy+=GRAV*(0.4 if self.p_jhold<JHOLD else 1.0)*dt
        elif self.p_air:
            self.pvy+=GRAV*dt
        self.pvy=min(self.pvy,MFALL)

        # Move
        self.px+=self.pvx*dt
        self.py+=self.pvy*dt

        # Ground / landing dust
        if self.py>=g:
            if not self.p_was_g and self.pvy>200:
                imp=min(self.pvy/800,1.0)
                self.p_sq_y=1.0+imp*0.4; self.p_sq_x=1.0-imp*0.25
                # Landing dust scaled by impact
                if not self.p_on_car:
                    self.spawn_dust_puff(self.px, g, intensity=0.6+0.6*imp)
            self.py=g; self.pvy=0; self.p_jmp=False; self.p_was_g=True
        else:
            self.p_was_g=False

        # Footstep cadence
        if not self.p_air and not self.p_on_car and abs(self.pvx)>40:
            cadence = FOOTSTEP_RUN if (run and abs(self.pvx)>WALK*0.95) else FOOTSTEP_GRD
            self.p_step_t += dt
            if self.p_step_t >= cadence:
                self.p_step_t = 0
                self.spawn_step(self.px, g, self.p_dir)
        else:
            self.p_step_t = FOOTSTEP_GRD*0.5  # reset so first step is quick

        # Squash recovery
        self.p_sq_y+=(1-self.p_sq_y)*15*dt
        self.p_sq_x+=(1-self.p_sq_x)*15*dt

        # Bounds
        self.px=max(0,min(WW*T-T,self.px))

        # Head bump / coin pickup
        htx=int(self.px//T); hty=int(self.py//T)
        ht=self.tile(htx,hty)
        if self.solid(ht) and self.py<hty*T:
            self.pvy=50
            if ht==3:
                self.coins+=1; self.score+=200
                self.lvl[hty][htx]=9
                # Burst of coin particles (magnet-aware)
                for _ in range(6):
                    self.particles.append(spawn_coin_anim(
                        htx*T+T//2+random.uniform(-8,8),
                        hty*T+random.uniform(-4,4)
                    ))
                self.hud_pulse=1.0
                self.hud_score_pulse=1.0

        # Enemies
        for e in self.t_enemies:
            if e['hp']<=0: continue
            e['x']+=e['vx']*dt; e['t']+=dt
            nxt=int((e['x']+(T if e['vx']>0 else 0))//T)
            Below=self.tile(nxt,int(e['y']//T)+1)
            if self.solid(Below) or not self.solid(self.tile(nxt,int(e['y']//T)+2)):
                e['vx']*=-1
            if abs(e['x']-self.px)<T and abs(e['y']-self.py)<T:
                if self.pvy>0 and self.py<e['y']-T//2:
                    e['hp']=0; self.pvy=JVEL*0.6; self.score+=100
                    self.spawn_parts(e['x'],e['y'],GOM,8)
                elif self.p_star>0 or self.p_inv>0:
                    e['hp']=0
                else:
                    if self.p_mode>0: self.p_mode=0; self.p_inv=2.0
                    else:
                        self.lives-=1
                        self.hud_flash=1.0
                        if self.lives<=0: self.game_over=True

        # ── Particle update with coin-magnet ──
        for p in self.particles[:]:
            # Coin magnet: accelerate toward player if within range
            if p['kind']=='coin':
                dx=self.px-p['x']; dy=(self.py-T//2)-p['y']
                d=math.hypot(dx,dy)
                if d<MAGNET_R and d>1:
                    f=MAGNET_FORCE*(1.0-d/MAGNET_R)
                    p['vx']+=(dx/d)*f*dt
                    p['vy']+=(dy/d)*f*dt - 300*dt  # slight lift
                else:
                    p['vy']+=GRAV*p['gravity']*dt
            else:
                p['vy']+=GRAV*p['gravity']*dt
            p['x']+=p['vx']*dt
            p['y']+=p['vy']*dt
            p['life']-=dt
            if p['life']<=0:
                # Coin collected: count it
                if p['kind']=='coin':
                    self.coins+=1; self.score+=50
                    self.hud_pulse=max(self.hud_pulse,0.5)
                self.particles.remove(p)

        # Cars
        for c in self.cars:
            c['x']+=c['vx']*dt
            if c['x']<0 or c['x']>WW*T: c['vx']*=-1

        if keys[pygame.K_f]:
            if self.p_on_car:
                self.p_on_car=False; self.p_car=None
            else:
                for c in self.cars:
                    if abs(c['x']-self.px)<T*2 and abs(c['y']-self.py)<T*2:
                        self.p_on_car=True; self.p_car=c; break

        if self.p_on_car and self.p_car:
            c=self.p_car; self.px=c['x']; self.py=c['y']-T
            if keys[pygame.K_d]: c['vx']=min(c['vx']+200*dt,400)
            elif keys[pygame.K_a]: c['vx']=max(c['vx']-200*dt,-200)
            else: c['vx']*=max(0,1-3*dt)

        # Camera (slightly faster follow + lead)
        target=self.px-W//3
        target=max(0,min(WW*T-W,target))
        self.cam+=(target-self.cam)*12*dt

    def draw(self,screen):
        cx=int(self.cam)
        # Sky bands
        for b in range(4):
            r=b/4
            screen.fill((int(SKY[0]+(180-SKY[0])*r),int(SKY[1]+(220-SKY[1])*r),int(SKY[2]+(255-SKY[2])*r)),(0,b*H//4,W,H//4+1))

        # Tiles (culled)
        stx=max(0,cx//T-1); etx=min(WW,cx//T+W//T+2)
        for tx in range(stx,etx):
            for ty in range(WH):
                t=self.lvl[ty][tx]
                if t==0: continue
                tile=get_tile(t)
                if tile:
                    sx=tx*T-cx
                    if -T<sx<W+T: screen.blit(tile,(sx,ty*T))

        # Enemies
        for e in self.t_enemies:
            if e['hp']<=0: continue
            sx=int(e['x']-cx); sy=int(e['y'])
            if -T<sx<W+T:
                pygame.draw.ellipse(screen,GOM,(sx,sy-T//2,T,T//2))
                pygame.draw.rect(screen,GOM,(sx+T//4,sy-T//3,T//2,T//3))
                pygame.draw.rect(screen,BLK,(sx+T//3,sy-T//3,T//6,T//8))
                pygame.draw.rect(screen,BLK,(sx+T//2,sy-T//3,T//6,T//8))
                of=4 if int(e['t']*4)%2==0 else 0
                pygame.draw.rect(screen,BLK,(sx+T//6+of,sy+T//2-4,T//3,T//6))
                pygame.draw.rect(screen,BLK,(sx+T//2-of,sy+T//2-4,T//3,T//6))

        # Particles
        for p in self.particles:
            t=p['life']/p['mlife']
            if p['kind']=='coin':
                # Spinning coin (scale X by cos of spin)
                spin=math.sin(p.get('spin',0)+p['mlife']*18)
                w=max(2,int(10*abs(spin)))
                h=10
                r=pygame.Rect(int(p['x']-cx)-w//2, int(p['y'])-h//2, w, h)
                pygame.draw.ellipse(screen,p['c'],r)
                pygame.draw.ellipse(screen,(255,240,140),r.inflate(-w//2,-h//2+2))
            else:
                sz=max(1,int(p['sz']*t))
                pygame.draw.circle(screen,p['c'],(int(p['x']-cx),int(p['y'])),sz)

        # Cars
        for c in self.cars:
            sx=int(c['x']-cx)
            if -T*2<sx<W+T*2:
                pygame.draw.rect(screen,c['color'],(sx,c['y']-T//2,T*2,T//2))
                pygame.draw.rect(screen,(60,60,70),(sx+T//2,c['y']-T,T,T//2))
                pygame.draw.rect(screen,(150,200,240),(sx+T//2+4,c['y']-T+4,T-8,T//3))
                pygame.draw.circle(screen,(30,30,30),(sx+T//3,c['y']),T//4)
                pygame.draw.circle(screen,(30,30,30),(sx+T*5//3,c['y']),T//4)

        # Player
        if not self.p_on_car:
            sx=int(self.px-cx); sy=int(self.py)
            big=self.p_mode>0; sm=self.p_mode==2
            if self.p_air: pose=3
            elif abs(self.pvx)>20: pose=1 if int(self.p_anim*8)%2==0 else 2
            else: pose=0
            spr=get_mario(big,sm,pose)
            sw2=max(1,int(spr.get_width()*self.p_sq_x))
            sh2=max(1,int(spr.get_height()*self.p_sq_y))
            if abs(self.p_sq_x-1.0)>0.02 or abs(self.p_sq_y-1.0)>0.02:
                spr=pygame.transform.scale(spr,(sw2,sh2))
            if not self.p_dir: spr=pygame.transform.flip(spr,True,False)
            # Invincibility flicker
            if self.p_inv>0 and int(self.p_inv*12)%2==0:
                spr=spr.copy(); spr.set_alpha(110)
            # Star rainbow tint
            if self.p_star>0:
                tint=(int(128+127*math.sin(self.p_anim*16)),
                      int(128+127*math.sin(self.p_anim*16+2.1)),
                      int(128+127*math.sin(self.p_anim*16+4.2)))
                spr=spr.copy(); spr.fill(tint+(0,),None,pygame.BLEND_RGB_MULT)
            screen.blit(spr,(sx-sw2//2,sy-sh2))

        # ═══ HUD ═══
        self._draw_hud(screen)

        if self.game_over:
            # Fade overlay
            ov=pygame.Surface((W,H),pygame.SRCALPHA)
            ov.fill((0,0,0,int(140*(1-self.hud_fade))))
            screen.blit(ov,(0,0))
            font=pygame.font.Font(None,72)
            go=font.render("GAME OVER",True,RED)
            go_s=pygame.font.Font(None,28).render("Press ESC to quit",True,WHT)
            screen.blit(go,(W//2-go.get_width()//2,H//2-30))
            screen.blit(go_s,(W//2-go_s.get_width()//2,H//2+30))

    def _draw_hud(self,screen):
        font=pygame.font.Font(None,36)
        med=pygame.font.Font(None,28)
        # HUD background (animated pulse on coin)
        pulse = 1.0 + self.hud_pulse*0.08
        bg_h = int(50*pulse)
        bg=pygame.Surface((W,bg_h),pygame.SRCALPHA)
        a = int(120 + 60*self.hud_pulse)
        bg.fill((0,0,0,min(220,a)))
        screen.blit(bg,(0,0))

        # Damage flash overlay
        if self.hud_flash>0:
            ov=pygame.Surface((W,H),pygame.SRCALPHA)
            ov.fill((220,40,40,int(120*self.hud_flash)))
            screen.blit(ov,(0,0))

        # ── Layout: [COIN xNNN] [SCORE NNNNNN]  [TITLE]  [TIME NN] [♥♥♥ xN] ──
        # Coin icon + count
        pygame.draw.circle(screen,YLW,(34,30),9)
        pygame.draw.circle(screen,(255,240,140),(31,27),3)
        if self.hud_pulse>0:
            r=int(11+self.hud_pulse*4)
            pygame.draw.circle(screen,YLW,(34,30),r,2)
        screen.blit(med.render(f"x{self.coins:03d}",True,YLW),(50,15))

        # Score (pulses on pickup)
        sc=int(255+255*self.hud_score_pulse)
        score_col=(min(255,sc),min(255,int(220+35*self.hud_score_pulse)),min(255,100))
        screen.blit(med.render(f"SCORE:{self.score:06d}",True,score_col),(150,15))

        # Centered title (fades in/out)
        title_surf=font.render("SUPER MARIO BROS",True,YLW)
        if self.hud_fade<1.0:
            title_surf=title_surf.copy(); title_surf.set_alpha(int(255*self.hud_fade))
        # Drop shadow (Mario Party aesthetic)
        sh=font.render("SUPER MARIO BROS",True,BLK)
        sh=sh.copy(); sh.set_alpha(int(160*self.hud_fade))
        tx = W//2 - title_surf.get_width()//2
        screen.blit(sh,(tx+2,12))
        screen.blit(title_surf,(tx,10))

        # Time (blinks red when low)
        time_col=RED if self.time<30 else WHT
        if self.time<30 and int(self.time*6)%2==0: time_col=YLW
        time_surf=med.render(f"TIME:{int(self.time)}",True,time_col)
        screen.blit(time_surf,(W-260,15))

        # Hearts row (right-aligned)
        for i in range(self.max_lives):
            h=HEART_F if i<self.lives else HEART_E
            yo=int(math.sin(self.p_anim*2 + i*0.7)*1.5)
            # Damage shake
            shake_x=0
            if self.hud_flash>0:
                shake_x=int(math.sin(self.p_anim*60+i)*3*self.hud_flash)
            screen.blit(h,(W-100+i*26+shake_x, 16+yo))
        # Lives number
        screen.blit(med.render(f"x{self.lives}",True,WHT),(W-22,15))


# ═══ MAIN ═══
def main():
    try:
        pygame.init()
        screen=pygame.display.set_mode((W,H))
        pygame.display.set_caption('Super Mario Bros 2D — V1.4.0 (Audit Pass)')
        clock=pygame.time.Clock()
        game=Game()
        print("SUPER MARIO BROS 2D V1.4.0 — Starting",flush=True)
        running=True
        while running:
            dt=clock.tick(FPS)/1000.0; dt=min(dt,0.05)
            for ev in pygame.event.get():
                if ev.type==pygame.QUIT: running=False
                if ev.type==pygame.KEYDOWN and ev.key==pygame.K_ESCAPE: running=False
            keys=pygame.key.get_pressed()
            game.run(dt,keys)
            game.draw(screen)
            pygame.display.flip()
    except Exception as e:
        print(f"ERROR:{e}",flush=True); traceback.print_exc()
    finally:
        pygame.quit(); print("GAME EXITED",flush=True)

if __name__=='__main__': main()
