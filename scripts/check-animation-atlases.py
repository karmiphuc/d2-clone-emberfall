"""Check shipped WebP coverage, exposure stability, dimensions and bank seams.
Uses Pillow/numpy/OpenCV from animation-requirements.txt; no RIFE model needed.
"""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
meta=json.loads((ROOT/'src/animation-sequence-data.json').read_text())
entries=[
 ('hero-sword-walk-sequence.webp','sword',1),('hero-axe-walk-sequence.webp','axe',1),
 ('hero-sword-attack-sequence.webp','swordStrike',1),('hero-axe-attack-sequence.webp','axeStrike',1),
 ('companions-a-walk-sequence.webp','a',3),('companions-b-walk-sequence.webp','b',3),
 ('companions-a-attack-sequence.webp','aAttack',3),('companions-b-attack-sequence.webp','bAttack',3),
 ('fallen-walk-sequence.webp','FallenRun',1),('risen-walk-sequence.webp','RisenRun',1),
 ('brute-walk-sequence.webp','BruteRun',1),('monster-attack-sequence.webp','monsters',3),
]
ranges=[]; core_min=255; seams=[]
for filename,key,actors in entries:
    directory = ROOT/'assets' if filename.startswith('companions-') and 'walk' in filename else ROOT/'public/art'
    rgba=np.array(Image.open(directory/filename).convert('RGBA'))
    cell=meta['heroCell' if filename.startswith('hero-') else 'otherCell'];count=meta[key]
    assert rgba.shape==(cell*count*actors,cell*4*meta['variants'],4),filename
    for actor in range(actors):
        for facing in range(4):
            endpoint=[]
            for variant in range(meta['variants']):
                frames=[];lumas=[]
                for row in range(count):
                    x=(variant*4+facing)*cell;y=(actor*count+row)*cell
                    frame=rgba[y:y+cell,x:x+cell];frames.append(frame)
                    mask=frame[:,:,3]>210
                    assert mask.sum()>20,(filename,actor,facing,variant,row,'empty surface')
                    lumas.append(float((frame[:,:,:3][mask]@np.array([.2126,.7152,.0722])).mean()))
                    core=cv2.erode((frame[:,:,3]>104).astype(np.uint8),np.ones((3,3),np.uint8))>0
                    if core.any():core_min=min(core_min,int(frame[:,:,3][core].min()))
                delta=max(lumas)-min(lumas);ranges.append(delta)
                assert delta<2,(filename,actor,facing,variant,delta,'exposure pulse')
                endpoint.append((frames[0],frames[-1]))
            for variant in range(1,meta['variants']):
                for edge in ([0] if 'walk' in filename else [0,1]):
                    a,b=endpoint[0][edge],endpoint[variant][edge]
                    assert np.array_equal(a[:,:,3],b[:,:,3]),(filename,'coverage seam',variant)
                    mask=a[:,:,3]>210
                    difference=float(np.abs(a[:,:,:3].astype(float)-b[:,:,:3].astype(float))[mask].mean())
                    seams.append(difference)
                    assert difference<8,(filename,'pose seam',variant,difference)
assert core_min>=250,('translucent painted interior',core_min)
print(json.dumps({'atlases':len(entries),'actorFacingSequences':len(ranges),'maxDecodedLumaRange':round(max(ranges),3),'minInteriorAlpha':core_min,'maxBankSeamRgbDifference':round(max(seams),3)},indent=2))
