"""Export selected licensed rigs and original role accessories for offline baking."""
import bpy
import math
import os
import sys
from pathlib import Path
from mathutils import Vector
stage = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
kind = sys.argv[sys.argv.index('--') + 2]
for image in bpy.data.images:
    candidate = stage / 'textures' / os.path.basename(image.filepath)
    if not image.packed_file and candidate.exists():
        image.filepath = str(candidate)
        image.reload()
        if image.size[0] > 1024:
            image.scale(1024, max(1, round(image.size[1] * 1024 / image.size[0])))
for collection in bpy.data.collections:
    collection.hide_render = False
    collection.hide_viewport = False
scene = bpy.context.scene
if kind in ['male', 'female']:
    rig = bpy.data.objects['MaleArm' if kind == 'male' else 'FemaleArm']
    # Mantle geometry is original; weights follow the spine and pelvis.
    vertices, faces = [], []
    for row in range(9):
        t = row / 8
        for col in range(9):
            u = col / 8 * 2 - 1
            vertices.append((u * (.24 + .18 * t), .12 + .24 * t + .018 * (1 - u*u), 1.65 - 1.04*t + .022*math.cos(u*12)*t))
    for row in range(8):
        for col in range(8):
            a = row*9 + col
            faces.append((a, a+1, a+10, a+9))
    mesh = bpy.data.meshes.new('EmberfallMantle')
    mesh.from_pydata(vertices, [], faces)
    cape = bpy.data.objects.new('mantle', mesh)
    scene.collection.objects.link(cape)
    back, hip = cape.vertex_groups.new(name='Back'), cape.vertex_groups.new(name='Hip')
    for row in range(9):
        for col in range(9):
            back.add([row*9+col], 1-row/8*.55, 'REPLACE')
            hip.add([row*9+col], row/8*.55, 'REPLACE')
    cape.modifiers.new('Rig', 'ARMATURE').object = rig
    material = bpy.data.materials.new('EmberfallMantleCloth')
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (.3,.3,.3,1)
    bsdf.inputs['Roughness'].default_value = .9
    mesh.materials.append(material)
    for polygon in mesh.polygons: polygon.use_smooth = True
    # A second dagger shares the off-hand socket and its bind transform.
    dagger = bpy.data.objects['dagger']
    off = dagger.copy()
    off.data = dagger.data.copy()
    off.name = 'off_dagger'
    scene.collection.objects.link(off)
    bind = rig.data.bones['Off'].matrix_local @ rig.data.bones['Main'].matrix_local.inverted()
    for vertex in off.data.vertices: vertex.co = bind @ vertex.co
    off.vertex_groups.clear()
    off.vertex_groups.new(name='Off').add(list(range(len(off.data.vertices))),1,'REPLACE')
    visible = {'mantle','off_dagger','leather_boots','leather_chest','leather_gloves','leather_hood','leather_pants','head_short','head_long','shortbow','dagger','mage_boots','mage_hood','mage_skirt','mage_sleeves','mage_vest','cloth_gloves','staff','rod','plate_boots','plate_cuirass','plate_gauntlets','plate_greaves','plate_helm','shield','longsword','mace'}
    selected = visible | {rig.name, 'SBowString'}
else:
    rig_name = {'goblin':'GobArm','zombie':'MaleArm','skeleton':'SkelArm','minotaur':'MinotaurRIG'}[kind]
    rig = bpy.data.objects[rig_name]
    selected = {rig_name} | {'goblin':{'Goblin','GoblinSpear'},'zombie':{'Zombie'},'skeleton':{'Skeleton','SkullSword','SpikeShield','ArmorHood','ArmorPauldrons','ArmorShinGuards'},'minotaur':{'Minotaur','WarAxe'}}[kind]
    if kind == 'skeleton':
        # Keep the boss's equipment attached through the source armature.
        for name in selected - {rig_name}:
            obj=bpy.data.objects[name]
            if obj.animation_data: obj.animation_data.action = None
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.data.objects:
    obj.hide_set(False)
    obj.select_set(obj.name in selected)
    obj.hide_render = obj.name not in selected

def export(name, bounded=False):
    bpy.ops.export_scene.gltf(filepath=str(stage / (name+'.glb')), export_format='GLB', use_selection=True,
        export_animations=True, export_animation_mode='ACTIVE_ACTIONS', export_force_sampling=True,
        export_frame_range=bounded, export_anim_single_armature=True)
if kind == 'minotaur':
    scene.frame_start, scene.frame_end = 1, 9
    for name, action in [('minotaur-walk','Run'),('minotaur-attack','Attack'),('minotaur-idle','Idle'),('minotaur-death','Death')]:
        rig.animation_data.action = bpy.data.actions[action]
        scene.frame_set(1)
        export(name, True)
else:
    scene.frame_set(1)
    export(kind)
print('EXPORTED', kind)
