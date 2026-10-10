import bpy,os,sys
from pathlib import Path
stage=Path(sys.argv[sys.argv.index("--")+1]).resolve()
s=bpy.context.scene
for i in bpy.data.images:
 p=str(stage/'textures'/os.path.basename(i.filepath))
 if not i.packed_file and os.path.exists(p):i.filepath=p;i.reload()
for c in bpy.data.collections:c.hide_render=False;c.hide_viewport=False
# Original burgundy mantle, skinned to the existing back and hip bones.
vertices=[];faces=[];rows=9;cols=9
for row in range(rows):
 t=row/(rows-1)
 for col in range(cols):
  u=col/(cols-1)*2-1
  vertices.append((u*(.24+.18*t), .12+.24*t+.018*(1-u*u),1.65-1.04*t+.022*__import__('math').cos(u*12)*t))
for row in range(rows-1):
 for col in range(cols-1):
  a=row*cols+col;faces.append((a,a+1,a+cols+1,a+cols))
mesh=bpy.data.meshes.new('EmberfallMantle');mesh.from_pydata(vertices,[],faces);mesh.update()
cape=bpy.data.objects.new('cape',mesh);s.collection.objects.link(cape)
back=cape.vertex_groups.new(name='Back');hip=cape.vertex_groups.new(name='Hip')
for row in range(rows):
 t=row/(rows-1)
 for col in range(cols):
  index=row*cols+col;back.add([index],1-t*.55,'REPLACE');hip.add([index],t*.55,'REPLACE')
modifier=cape.modifiers.new('Rig','ARMATURE');modifier.object=bpy.data.objects['MaleArm']
mat=bpy.data.materials.new('EmberfallBurgundy');mat.use_nodes=True;node=mat.node_tree.nodes.get('Principled BSDF');node.inputs['Base Color'].default_value=(.15,.009,.015,1);node.inputs['Roughness'].default_value=.9;cape.data.materials.append(mat)
for polygon in mesh.polygons:polygon.use_smooth=True

bpy.ops.object.select_all(action='DESELECT')
visible={'cape','chain_boots','chain_cuirass','chain_gloves','chain_greaves','leather_boots','leather_chest','leather_gloves','leather_pants','head_short','longsword','hand_axe','mace','shield','plate_boots','plate_cuirass','plate_gauntlets','plate_greaves','plate_helm'}
for o in bpy.data.objects:
 if o.name in visible or o.name=='MaleArm':o.hide_set(False);o.hide_render=False;o.select_set(True)
 else:o.hide_render=True
s.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(stage/'prototype.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_force_sampling=True,export_frame_range=False,export_anim_single_armature=True)
print('EXPORTED')
