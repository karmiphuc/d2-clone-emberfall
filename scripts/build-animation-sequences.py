"""Bake painted key poses into sprite sequences. Requires Pillow, numpy, OpenCV.
The game consumes committed WebP atlases; no per-frame optical-flow shader.
Requires a separately downloaded RIFE 4.9 ONNX interpolation model.
"""
from pathlib import Path
import json
import os
import hashlib
import onnxruntime as ort
import cv2
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'public/art'
SIZE = 160
cv2.setNumThreads(2)
cache = {}
model = os.environ.get('RIFE_MODEL')
if not model: raise SystemExit('Set RIFE_MODEL to the RIFE 4.9 ONNX model path; see docs/ARCHITECTURE.md')
options = ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
inference = ort.InferenceSession(model,sess_options=options,providers=['CPUExecutionProvider'])

def frame(file, rows, row, col, factor=1):
    path = Path(file) if str(file).startswith('/') else ART/file
    if path not in cache: cache[path] = Image.open(path).convert('RGBA')
    im=cache[path]; w,h=im.width//4,im.height//rows
    rgba=np.asarray(im.crop((col*w,row*h,(col+1)*w,(row+1)*h)).resize((SIZE,SIZE),Image.Resampling.LANCZOS)).copy()
    if factor != 1:
        rgba=cv2.warpAffine(rgba,np.float32([[factor,0,SIZE*.5*(1-factor)],[0,factor,SIZE*.94*(1-factor)]]),(SIZE,SIZE),flags=cv2.INTER_CUBIC)
    return rgba

def register(src,ref):
    def bounds(a):
        y,x=np.where(a[:,:,3]>80)
        rgb=a[:,:,:3].astype(float)
        mask=(a[:,:,3]>100)&(rgb[:,:,0]>rgb[:,:,1]*1.05)&(rgb[:,:,0]>rgb[:,:,2]*1.2)&(rgb[:,:,1]>20)
        mask[:, :int(SIZE*.35)]=False;mask[:,int(SIZE*.67):]=False;mask[int(SIZE*.48):,:]=False
        warm=np.where(mask)[0]
        return int(warm.min() if len(warm) else y.min()),int(y.max())
    sy0,sy1=bounds(src);ry0,ry1=bounds(ref);scale=(ry1-ry0)/(sy1-sy0)
    def chest(a,y0,y1):
        mask=a[int(y0+(y1-y0)*.3):int(y0+(y1-y0)*.5),:,3].astype(float)
        return (mask.sum(axis=0)*np.arange(SIZE)).sum()/mask.sum()
    tx=chest(ref,ry0,ry1)-chest(src,sy0,sy1)*scale
    return cv2.warpAffine(src,np.float32([[scale,0,tx],[0,scale,ry1-sy1*scale]]),(SIZE,SIZE),flags=cv2.INTER_CUBIC)

def tween(a,b,t):
    if t<=0:return a
    if t>=1:return b
    frames=[z.astype(np.float32)/255 for z in [a,b]]
    def run(images):
        inputs=[z.transpose(2,0,1)[None].copy() for z in images]
        return inference.run(None,dict(img0=inputs[0],img1=inputs[1],timestep=np.array([t],np.float32)))[0][0].transpose(1,2,0)
    rgb=run([z[:,:,:3]*z[:,:,3:4] for z in frames])
    alpha=run([np.repeat(z[:,:,3:4],3,axis=2) for z in frames]).mean(axis=2)[:,:,None]
    alpha=np.maximum(alpha,np.max(rgb,axis=2)[:,:,None])
    rgb/=np.maximum(alpha,1/255)
    return np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255).astype(np.uint8)

def bake(name,characters,steps,loop):
    count=(len(characters[0][0]) if loop else len(characters[0][0])-1)*steps+(0 if loop else 1)
    if os.environ.get('SKIP_HERO') and name.startswith('hero-'): return count
    out=Image.new('RGBA',(SIZE*4,SIZE*count*len(characters)))
    for actor,cols in enumerate(characters):
        for col,keys in enumerate(cols):
            pairs=list(zip(keys,keys[1:]+([keys[0]] if loop else [])))
            for segment,(a,b) in enumerate(pairs):
                for sub in range(steps):
                    image=tween(a,b,sub/steps)
                    out.paste(Image.fromarray(image), (col*SIZE,(actor*count+segment*steps+sub)*SIZE))
            if not loop:out.paste(Image.fromarray(keys[-1]),(col*SIZE,(actor*count+count-1)*SIZE))
    out.save(ART/name,quality=88,method=4)
    print(f'{name}: {count} frames x {len(characters)} characters, {(ART/name).stat().st_size:,} bytes',flush=True)
    return count

meta={'interpolator':'RIFE 4.9 ONNX','modelSha256':hashlib.sha256(Path(model).read_bytes()).hexdigest()}
for weapon in ['sword','axe']:
    passing=ART/f'hero-{weapon}-passing.webp'
    opposite=ART/f'hero-{weapon}-passing-opposite.webp'
    cols=[]
    for col in range(4):
        a=frame(f'hero-{weapon}-motion.webp',4,0,col,1.08)
        b=frame(f'hero-{weapon}-motion.webp',4,1,col,1.08)
        # Contact and new passing poses alternate around the stride loop.
        if passing.exists() and opposite.exists():
            p=register(frame(passing,2,0,col),a)
            q=register(frame(opposite,1,0,col),b)
            cols.append([a,p,b,q])
        else:cols.append([a,b])
    meta[weapon]=bake(f'hero-{weapon}-walk-sequence.webp',[cols],4 if len(cols[0])==4 else 8,True)
    cols=[]
    for col in range(4):
        original=[frame(f'hero-{weapon}-strikes.webp',6,row,col) for row in range(6)]
        mid=ART/f'hero-{weapon}-downstroke.webp'
        if not mid.exists():raise SystemExit(f'Missing {mid}')
        top=register(frame(mid,2,0,col),original[2])
        low=register(frame(mid,2,1,col),original[3])
        cols.append([original[0],original[1],top,original[2],low,*original[3:],frame('hero-directions.webp',2,0 if weapon=='sword' else 1,col)])
    meta[weapon+'Strike']=bake(f'hero-{weapon}-attack-sequence.webp',[cols],4,False)
SIZE = 128
for sheet in ['a','b']:
    chars=[]
    for actor in range(3):
        chars.append([[frame(f'companions-{sheet}-motion.webp',6,actor*2+i,col) for i in range(2)] for col in range(4)])
    meta[sheet]=bake(f'companions-{sheet}-walk-sequence.webp',chars,8,True)
    chars=[]
    factors={'a':[1.04,1,1.06],'b':[1,1.033,1.058]}
    for actor in range(3):
        chars.append([[frame(f'companions-{sheet}-attacks.webp',6,actor*2+i,col,factors[sheet][actor]) for i in range(2)]+[frame(f'companions-{sheet}.webp',3,actor,col)] for col in range(4)])
    meta[sheet+'Attack']=bake(f'companions-{sheet}-attack-sequence.webp',chars,8,False)
for actor,name in enumerate(['Fallen','Risen','Brute']):
    cols=[[frame(name.lower()+'-run.webp',4,i,col) for i in range(4)] for col in range(4)]
    meta[name+'Run']=bake(name.lower()+'-walk-sequence.webp',[cols],4,True)
chars=[]
for actor,name in enumerate(['Fallen','Risen','Brute']):
    chars.append([[frame('monster-attacks.webp',6,actor*2+i,col,1.32 if name=='Risen' else 1.24) for i in range(2)]+[frame('monsters.webp',3,actor,col)] for col in range(4)])
meta['monsters']=bake('monster-attack-sequence.webp',chars,8,False)
(ROOT/'src/animation-sequence-data.json').write_text(json.dumps(meta,indent=2)+'\n')
