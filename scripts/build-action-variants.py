"""Normalize baked sprites and add three coherent variants in horizontal banks.
Run build-animation-sequences.py first for a clean source bake. Alternate hero
keys are original painted poses; other variants use anchored pose deformation.
No model, pose warping, or image processing executes in the browser.
"""
from pathlib import Path
import importlib.util
import json
import os
import cv2
import numpy as np
from PIL import Image
from sprite_consistency import exposure, stabilize, vary_pose

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'public/art'
spec = importlib.util.spec_from_file_location('base_bake', ROOT/'scripts/build-animation-sequences.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
meta = json.loads((ROOT/'src/animation-sequence-data.json').read_text())

# First normalize stationary surfaces too, so returning to guard cannot change
# overall opacity. Their material colors and directional shading remain intact.
for filename, rows in [('hero-directions.webp',2),('companions-a.webp',3),('companions-b.webp',3),('monsters.webp',3)]:
    im = Image.open(ART/filename).convert('RGBA'); cell = im.width//4
    out = Image.new('RGBA', im.size)
    for actor in range(rows):
        for col in range(4):
            rgba=np.array(im.crop((col*cell,actor*cell,(col+1)*cell,(actor+1)*cell)))
            out.paste(Image.fromarray(stabilize(rgba, exposure(rgba))),(col*cell,actor*cell))
    out.save(ART/filename,quality=94,method=4)
base.cache.clear()

entries = [
 ('hero-sword-walk-sequence.webp','sword',1,'walk','hero-directions.webp',2,0),
 ('hero-axe-walk-sequence.webp','axe',1,'walk','hero-directions.webp',2,1),
 ('hero-sword-attack-sequence.webp','swordStrike',1,'attack','hero-directions.webp',2,0),
 ('hero-axe-attack-sequence.webp','axeStrike',1,'attack','hero-directions.webp',2,1),
 ('companions-a-walk-sequence.webp','a',3,'walk','companions-a.webp',3,0),
 ('companions-b-walk-sequence.webp','b',3,'walk','companions-b.webp',3,0),
 ('companions-a-attack-sequence.webp','aAttack',3,'attack','companions-a.webp',3,0),
 ('companions-b-attack-sequence.webp','bAttack',3,'attack','companions-b.webp',3,0),
 ('fallen-walk-sequence.webp','FallenRun',1,'walk','monsters.webp',3,0),
 ('risen-walk-sequence.webp','RisenRun',1,'walk','monsters.webp',3,1),
 ('brute-walk-sequence.webp','BruteRun',1,'walk','monsters.webp',3,2),
 ('monster-attack-sequence.webp','monsters',3,'attack','monsters.webp',3,0),
]
metrics=[]
for filename,key,actors,action,idle,idle_rows,idle_offset in entries:
    count=meta[key]
    source=Image.open(Path(os.environ.get('BASE_SEQUENCE_DIR',str(ART)))/filename).convert('RGBA')
    original_cell=source.height//(count*actors)
    size=128 if filename.startswith('hero-') else 96
    atlas=Image.new('RGBA',(size*12,size*count*actors))
    for actor in range(actors):
        for col in range(4):
            idle_pose=base.frame(idle,idle_rows,actor+idle_offset,col)
            target=exposure(idle_pose)
            frames=[np.array(source.crop((col*original_cell,(actor*count+r)*original_cell,(col+1)*original_cell,(actor*count+r+1)*original_cell)).resize((160,160),Image.Resampling.LANCZOS)) for r in range(count)]
            frames=[stabilize(f,target) for f in frames]
            variants=[frames]
            if filename.startswith('hero-') and action=='attack':
                weapon='sword' if 'sword' in filename else 'axe'
                for variant in [1,2]:
                    poses=[base.register(base.frame(f'hero-{weapon}-alternate-keys.webp',6,(variant-1)*3+r,col),frames[12 if r==1 else 0]) for r in range(3)]
                    wind,hit,follow=[stabilize(f,target) for f in poses]
                    keys=[frames[0],wind,stabilize(base.tween(wind,hit,.68),target),hit,stabilize(base.tween(hit,follow,.45),target),follow,frames[24],frames[28],frames[32]]
                    sequence=[]
                    for a,b in zip(keys,keys[1:]):
                        sequence += [stabilize(base.tween(a,b,sub/4),target) for sub in range(4)]
                    sequence.append(frames[-1])
                    variants.append(sequence)
            else:
                for variant in [1,2]:
                    sequence=[]
                    for r in range(count):
                        phase=r/(count if action=='walk' else count-1)
                        sample=frames[r]
                        if action=='walk':
                            p=(phase+(1 if variant==1 else -1)*.045*np.sin(phase*2*np.pi))*count
                            i=int(p)%count;t=p-int(p)
                            # Only adjacent already-inferred poses; no random
                            # key ordering or direction/leg reversal.
                            sample=np.clip(frames[i].astype(float)*(1-t)+frames[(i+1)%count].astype(float)*t,0,255).astype(np.uint8)
                        sequence.append(stabilize(vary_pose(sample,phase,variant,action,col),target))
                    variants.append(sequence)
            for variant,sequence in enumerate(variants):
                luminances=[]; opaque=[]
                for r,f in enumerate(sequence):
                    f=np.array(Image.fromarray(f).resize((size,size),Image.Resampling.LANCZOS))
                    f=stabilize(f,target)
                    opaque.append(float((f[:,:,3]>250).sum()/max(1,(f[:,:,3]>150).sum())))
                    luminances.append(float(exposure(f)@np.array([.2126,.7152,.0722])))
                    atlas.paste(Image.fromarray(f),((variant*4+col)*size,(actor*count+r)*size))
                metrics.append({'atlas':filename,'actor':actor,'facing':col,'variant':variant,'lumaRange':round(max(luminances)-min(luminances),3),'opaqueInteriorMin':round(min(opaque),3)})
    atlas.save(ART/filename,quality=85,method=4)
    print(f'{filename}: {atlas.width}x{atlas.height}, {(ART/filename).stat().st_size:,} bytes',flush=True)
meta.update(variants=3,heroCell=128,otherCell=96,consistency='opaque interiors and per-facing diffuse exposure')
(ROOT/'src/animation-sequence-data.json').write_text(json.dumps(meta,indent=2)+'\n')
Path('/tmp/emberfall-v15-consistency.json').write_text(json.dumps(metrics,indent=2)+'\n')
