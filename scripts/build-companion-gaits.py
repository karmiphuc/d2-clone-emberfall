"""Bake four authored step phases per mercenary; requires RIFE_MODEL.

Only replaces companion walking atlases. Source sheets are four facings by
four phases: contact, passing, opposite contact, opposite passing.
"""
from pathlib import Path
import importlib.util
import json
import cv2
import numpy as np
from PIL import Image, ImageOps
from sprite_consistency import exposure, stabilize, vary_pose

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'public/art'
spec = importlib.util.spec_from_file_location('base', ROOT/'scripts/build-animation-sequences.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
COUNT, CELL, STEPS = 24, 96, 6
def clean(rgba):
    # Reject isolated fragments bleeding across a source-sheet cell boundary;
    # those fragments otherwise get mistaken for a head/foot during registration.
    count, labels, stats, _ = cv2.connectedComponentsWithStats((rgba[:,:,3]>80).astype(np.uint8))
    threshold = max(24, stats[1:,cv2.CC_STAT_AREA].max()*.005)
    kept = [i for i in range(1,count) if stats[i,cv2.CC_STAT_AREA] >= threshold]
    mask = cv2.dilate(np.isin(labels,kept).astype(np.uint8),np.ones((3,3),np.uint8))
    out = rgba.copy()
    out[mask==0] = 0
    return out

def opposite(name, col):
    # Single-row paintings have taller cells. Contain them before registration
    # rather than stretching their anatomy into square playback cells.
    source = Image.open(ART/f'merc-{name}-opposite.webp').convert('RGBA')
    width = source.width//4
    cell = source.crop((col*width,0,(col+1)*width,source.height))
    return np.array(ImageOps.pad(cell,(base.SIZE,base.SIZE),method=Image.Resampling.LANCZOS,color=(0,0,0,0)))

for sheet, names in [('a', ['ilyra', 'bram', 'eira']), ('b', ['soren', 'aldric', 'nyx'])]:
    atlas = Image.new('RGBA', (CELL*12, CELL*COUNT*3))
    for actor, name in enumerate(names):
        for col in range(4):
            idle = base.frame(f'companions-{sheet}.webp', 3, actor, col)
            target = exposure(idle)
            keys = [stabilize(base.register(clean(base.frame(f'merc-{name}-walk-keys.webp', 4, row, col)), idle), target) for row in range(4)]
            keys[2] = stabilize(base.register(clean(opposite(name,col)),idle),target)
            frames = []
            for a, b in zip(keys, keys[1:]+keys[:1]):
                frames.extend(stabilize(base.tween(a, b, sub/STEPS), target) for sub in range(STEPS))
            for variant in range(3):
                for row in range(COUNT):
                    phase = row/COUNT
                    sample = frames[row]
                    if variant:
                        p = (phase + (1 if variant == 1 else -1)*.045*np.sin(phase*2*np.pi))*COUNT
                        index, t = int(p)%COUNT, p-int(p)
                        sample = np.clip(frames[index].astype(float)*(1-t)+frames[(index+1)%COUNT].astype(float)*t, 0, 255).astype(np.uint8)
                        sample = vary_pose(sample, phase, variant, 'walk', col)
                    image = Image.fromarray(stabilize(sample, target)).resize((CELL,CELL), Image.Resampling.LANCZOS)
                    atlas.paste(Image.fromarray(stabilize(np.array(image), target)), ((variant*4+col)*CELL,(actor*COUNT+row)*CELL))
        print(f'{name}: four step phases, {COUNT} frames, three variations', flush=True)
    path = base.sequence_path(f'companions-{sheet}-walk-sequence.webp')
    atlas.save(path, quality=85, method=4)
    print(f'{path.name}: {atlas.size}, {path.stat().st_size:,} bytes', flush=True)
meta_path = ROOT/'src/animation-sequence-data.json'
meta = json.loads(meta_path.read_text())
meta.update(a=COUNT, b=COUNT)
meta_path.write_text(json.dumps(meta, indent=2)+'\n')
