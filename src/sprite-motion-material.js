import * as T from "three";
import metadata from "./motion-flow-data.json";

// Optical-flow vectors are numerical UV displacements, not replacement art.
// Source and destination are pulled towards the same intermediate silhouette.
const flowUrl = new URL("../public/art/motion-flow.bin", import.meta.url).href;
const empty = new T.DataTexture(new Uint8Array([128, 128, 128, 128]), 1, 1);
empty.needsUpdate = true;
const fields = new Map();
fetch(flowUrl)
  .then((r) => {
    if (!r.ok) throw Error("Motion vectors unavailable");
    return r.arrayBuffer();
  })
  .then((buffer) => {
    for (const [key, entry] of Object.entries(metadata.sheets)) {
      const texture = new T.DataTexture(
        new Uint8Array(buffer, entry.offset, entry.length),
        metadata.size * 4,
        metadata.size * entry.rows,
      );
      texture.magFilter = T.LinearFilter;
      texture.minFilter = T.LinearFilter;
      texture.needsUpdate = true;
      fields.set(key, texture);
    }
  })
  .catch(() => {}); // Authored poses remain usable if the optional vector fetch fails.

export function createMotionMaterial(map) {
  const material = new T.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: 0.18,
    depthWrite: true,
    toneMapped: false,
  });
  const uniforms = {
    poseA: { value: map },
    poseB: { value: map },
    rectA: { value: new T.Vector4() },
    rectB: { value: new T.Vector4() },
    motionField: { value: empty },
    fieldRect: { value: new T.Vector4() },
    poseMix: { value: 0 },
    fieldRange: { value: metadata.range * 2 },
    hasField: { value: 0 },
    scaleA: { value: 1 },
    scaleB: { value: 1 },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 motionUv;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nmotionUv = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
      varying vec2 motionUv;
      uniform sampler2D poseA, poseB, motionField;
      uniform vec4 rectA, rectB, fieldRect;
      uniform float poseMix, fieldRange, hasField, scaleA, scaleB;
      vec4 vectors(vec2 p) {
        return (texture2D(motionField, fieldRect.xy + clamp(vec2(p.x,1.0-p.y),0.01,0.99)*fieldRect.zw)-0.5)*fieldRange;
      }
      vec4 samplePose(sampler2D image,vec4 rect,vec2 p) {
        if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0)return vec4(0.0);
        return texture2D(image,rect.xy+clamp(p,0.002,0.998)*rect.zw);
      }
    `,
      )
      .replace(
        "#include <map_fragment>",
        `
      vec2 originA=(motionUv-vec2(0.5,0.06))*scaleA+vec2(0.5,0.06);
      vec2 originB=(motionUv-vec2(0.5,0.06))*scaleB+vec2(0.5,0.06);
      vec2 pa=originA, pb=originB;
      if(hasField>0.5) {
        pa=originA-vectors(pa).xy*poseMix;
        pa=originA-vectors(pa).xy*poseMix;
        pb=originB-vectors(pb).zw*(1.0-poseMix);
        pb=originB-vectors(pb).zw*(1.0-poseMix);
      }
      vec4 a=samplePose(poseA,rectA,pa), b=samplePose(poseB,rectB,pb);
      vec4 blended=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),poseMix);
      blended.rgb/=max(blended.a,0.0001);
      diffuseColor*=blended;
    `,
      );
  };
  material.customProgramCacheKey = () => "emberfall-motion-v1";
  let previous = null,
    transition = null;
  return {
    material,
    sample({
      map,
      key,
      row,
      next,
      mix,
      column,
      count,
      clip,
      factor = 1,
      dt = 1 / 60,
    }) {
      const frame = { map, key, row, column, count, clip, factor };
      if (
        previous &&
        (previous.key !== key ||
          previous.column !== column ||
          previous.clip !== clip)
      )
        transition = { from: previous, elapsed: 0 };
      previous = frame;
      let a = frame,
        b = { ...frame, row: next },
        blend = mix;
      if (transition) {
        transition.elapsed += dt;
        const t = Math.min(1, transition.elapsed / 0.065);
        a = transition.from;
        b = frame;
        blend = t * t * (3 - 2 * t);
        if (t >= 1) transition = null;
      }
      uniforms.poseA.value = a.map;
      uniforms.poseB.value = b.map;
      uniforms.rectA.value.set(
        a.column / 4,
        1 - (a.row + 1) / a.count,
        0.25,
        1 / a.count,
      );
      uniforms.rectB.value.set(
        b.column / 4,
        1 - (b.row + 1) / b.count,
        0.25,
        1 / b.count,
      );
      uniforms.poseMix.value = blend;
      uniforms.scaleA.value = 1.4 / a.factor;
      uniforms.scaleB.value = 1.4 / b.factor;
      const entry = metadata.sheets[a.key];
      const pair =
        entry?.pairs.findIndex(([x, y]) => x === a.row && y === b.row) ?? -1;
      const flow =
        a.map === b.map &&
        a.key === b.key &&
        a.column === b.column &&
        fields.get(a.key);
      uniforms.hasField.value = flow && pair >= 0 && blend > 0 ? 1 : 0;
      uniforms.motionField.value = flow || empty;
      uniforms.fieldRect.value.set(
        a.column / 4,
        pair / Math.max(1, entry?.rows || 1),
        0.25,
        1 / Math.max(1, entry?.rows || 1),
      );
      return { mix: blend, flow: !!uniforms.hasField.value };
    },
  };
}
