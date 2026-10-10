"""Build UV motion vectors from original atlases; source illustrations stay unchanged.
Requires Pillow, numpy and opencv-python-headless. Runtime consumes only the binary.
"""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SIZE = 48
RANGE = 0.4
SHEETS = {
    'sword': ('hero-sword-motion.webp', 4, [[0, 1], [1, 0]]),
    'axe': ('hero-axe-motion.webp', 4, [[0, 1], [1, 0]]),
    'a': ('companions-a-motion.webp', 6, [[r, r + 1] for r in range(0, 6, 2)] + [[r + 1, r] for r in range(0, 6, 2)]),
    'b': ('companions-b-motion.webp', 6, [[r, r + 1] for r in range(0, 6, 2)] + [[r + 1, r] for r in range(0, 6, 2)]),
    'swordStrike': ('hero-sword-strikes.webp', 6, [[r, r + 1] for r in range(5)]),
    'axeStrike': ('hero-axe-strikes.webp', 6, [[r, r + 1] for r in range(5)]),
    'aAttack': ('companions-a-attacks.webp', 6, [[r, r + 1] for r in range(0, 6, 2)]),
    'bAttack': ('companions-b-attacks.webp', 6, [[r, r + 1] for r in range(0, 6, 2)]),
    'monsters': ('monster-attacks.webp', 6, [[r, r + 1] for r in range(0, 6, 2)]),
    **{name + 'Run': (name.lower() + '-run.webp', 4, [[r, (r + 1) % 4] for r in range(4)]) for name in ['Fallen', 'Risen', 'Brute']},
}
blocks = []
meta = {'size': SIZE, 'range': RANGE, 'sheets': {}}
offset = 0
for key, (filename, rows, pairs) in SHEETS.items():
    im = Image.open(ROOT / 'public/art' / filename).convert('RGBA')
    w, h = im.width // 4, im.height // rows
    frames = {}
    for row in range(rows):
        for col in range(4):
            rgba = np.asarray(im.crop((col*w,row*h,(col+1)*w,(row+1)*h)).resize((SIZE,SIZE),Image.Resampling.LANCZOS))
            # Alpha contributes strongly to silhouette correspondence, while texture locates limbs.
            gray = cv2.cvtColor(rgba[:,:,:3], cv2.COLOR_RGB2GRAY).astype(np.float32)
            gray = (gray * .55 + rgba[:,:,3] * .45) * (rgba[:,:,3] / 255)
            frames[(row,col)] = np.clip(gray,0,255).astype(np.uint8)
    atlas = np.zeros((SIZE*len(pairs),SIZE*4,4),dtype=np.uint8)
    for pair,(a,b) in enumerate(pairs):
        for col in range(4):
            flows=[]
            for x,y in [(a,b),(b,a)]:
                flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(frames[(x,col)],frames[(y,col)],None)
                flow[:,:,1] *= -1 # texture V increases upwards
                flows.append(np.clip(flow/SIZE,-RANGE,RANGE))
            encoded = np.rint((np.concatenate(flows,axis=2)/RANGE*.5+.5)*255).astype(np.uint8)
            atlas[pair*SIZE:(pair+1)*SIZE,col*SIZE:(col+1)*SIZE]=encoded
    raw=atlas.tobytes(); blocks.append(raw)
    meta['sheets'][key]={'offset':offset,'length':len(raw),'rows':len(pairs),'pairs':pairs}
    offset += len(raw)
(ROOT/'public/art/motion-flow.bin').write_bytes(b''.join(blocks))
(ROOT/'src/motion-flow-data.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print(f'Generated {offset:,} bytes of motion vectors across {len(SHEETS)} sheets')
