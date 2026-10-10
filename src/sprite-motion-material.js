import * as T from "three";
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
    poseMix: { value: 0 },
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
      uniform sampler2D poseA, poseB;
      uniform vec4 rectA, rectB;
      uniform float poseMix, scaleA, scaleB;
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
      vec4 a=samplePose(poseA,rectA,originA);
      vec4 blended=a;
      if(poseMix>0.001) {
        vec4 b=samplePose(poseB,rectB,originB);
        blended=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),poseMix);
        blended.rgb/=max(blended.a,0.0001);
      }
      diffuseColor*=blended;
    `,
      );
  };
  material.customProgramCacheKey = () => "emberfall-sequence-v2";
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
      return { mix: blend, sequence: key !== "idle" };
    },
  };
}
