"""Download the pinned, licensed character source and its texture dependencies."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import sys
import urllib.request

REVISION = '00d4ca3a20718345d9f8d8ebad865ce52da05be9'
BASE = f'https://media.githubusercontent.com/media/flareteam/flare-game-art-src/{REVISION}/art_src_hd/'
stage = Path(sys.argv[1]).resolve()
(stage / 'textures').mkdir(parents=True, exist_ok=True)
files = [('characters/hero/hero.blend', stage / 'hero.blend')]
files += [('textures/' + name, stage / 'textures' / name) for name in [
    'chain_diffuse.jpg', 'chain_normal.png', 'darkiron.jpg', 'iron.jpg',
    'leather.jpg', 'wood.png', 'HairFur.png', 'cloudy_mountains.jpg',
]]

if '--cast' in sys.argv:
    files += [(f'characters/{name}/{name}.blend', stage / (name + '.blend')) for name in ['heroine','goblin','zombie','skeleton','minotaur']]
    files += [(name, stage / 'textures' / Path(name).name) for name in [
        'tilesets/dungeon/textures/pine_green.jpg',
        'characters/minotaur/textures/minotaur_muscle_normal.png',
        *[f'textures/Paper001_4K-JPG/Paper001_4K_{channel}.jpg' for channel in ['Color','NormalGL','Roughness','Displacement']],
    ]]

def download(entry):
    source, target = entry
    if not target.exists():
        try:
            data = urllib.request.urlopen(BASE + source, timeout=60).read()
        except urllib.error.HTTPError as error:
            if error.code != 404: raise
            # Non-LFS texture files are served by GitHub's raw endpoint.
            data = urllib.request.urlopen(f'https://raw.githubusercontent.com/flareteam/flare-game-art-src/{REVISION}/art_src_hd/' + source, timeout=60).read()
        if data.startswith(b'version https://git-lfs'): raise RuntimeError('Received an LFS pointer instead of source data')
        target.write_bytes(data)
    return {'file': source, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}

with ThreadPoolExecutor(max_workers=4) as executor:
    records = list(executor.map(download, files))
import json
(stage / 'source-manifest.json').write_text(json.dumps({'repository': 'flareteam/flare-game-art-src', 'revision': REVISION, 'files': records}, indent=2) + '\n')
print(f'Prepared licensed source at {stage}')
