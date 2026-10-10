import * as T from "three";

// Blend complete fractional poses during clip/facing transitions. Holding a
// floor(row) destination for the fade makes a fast attack skip then snap ahead.
export function createMotionMaterial(map) {
  const material = new T.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    toneMapped: false,
  });
  const uniforms = {
    poseAtlas: { value: map },
    previousAtlas: { value: map },
    rectCurrent: { value: new T.Vector4() },
    rectNext: { value: new T.Vector4() },
    rectPrevious: { value: new T.Vector4() },
    rectPreviousNext: { value: new T.Vector4() },
    frameMix: { value: 0 },
    previousMix: { value: 0 },
    transitionMix: { value: 1 },
    frameScale: { value: 1 },
    previousScale: { value: 1 },
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
        uniform sampler2D poseAtlas, previousAtlas;
        uniform vec4 rectCurrent, rectNext, rectPrevious, rectPreviousNext;
        uniform float frameMix, previousMix, transitionMix, frameScale, previousScale;
        vec4 samplePose(sampler2D image, vec4 rect, vec2 p) {
          if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0)return vec4(0.0);
          vec4 c=texture2D(image,rect.xy+clamp(p,0.002,0.998)*rect.zw);
          return vec4(c.rgb*c.a,c.a);
        }
        vec4 fractionalPose(sampler2D image,vec4 a,vec4 b,vec2 p,float t) {
          vec4 pose=samplePose(image,a,p);
          if(t>0.001)pose=mix(pose,samplePose(image,b,p),t);
          return pose;
        }
      `,
      )
      .replace(
        "#include <map_fragment>",
        `
        vec2 currentUv=(motionUv-vec2(0.5,0.06))*frameScale+vec2(0.5,0.06);
        vec4 blended=fractionalPose(poseAtlas,rectCurrent,rectNext,currentUv,frameMix);
        if(transitionMix<0.999) {
          vec2 previousUv=(motionUv-vec2(0.5,0.06))*previousScale+vec2(0.5,0.06);
          vec4 from=fractionalPose(previousAtlas,rectPrevious,rectPreviousNext,previousUv,previousMix);
          blended=mix(from,blended,transitionMix);
        }
        blended.rgb/=max(blended.a,0.0001);
        diffuseColor*=blended;
      `,
      );
  };
  material.customProgramCacheKey = () => "emberfall-sequence-v4";
  let previous = null,
    transition = null;
  function rect(target, frame, row) {
    target.set(
      frame.column / frame.columns,
      1 - (row + 1) / frame.count,
      1 / frame.columns,
      1 / frame.count,
    );
  }
  return {
    material,
    sample({
      map,
      key,
      row,
      next,
      mix,
      column,
      columns = 4,
      count,
      clip,
      factor = 1,
      dt = 1 / 60,
      directWalk = false,
    }) {
      const frame = {
        map,
        key,
        row,
        next,
        mix,
        column,
        columns,
        count,
        clip,
        factor,
      };
      if (directWalk && (clip === "walk" || previous?.clip === "walk"))
        transition = null;
      else if (
        previous &&
        (previous.key !== key ||
          previous.column !== column ||
          previous.clip !== clip)
      )
        transition = { from: previous, elapsed: 0 };
      previous = frame;
      let weight = 1;
      if (transition) {
        transition.elapsed += dt;
        const t = Math.min(1, transition.elapsed / 0.09);
        weight = t * t * (3 - 2 * t);
      }
      const from = transition?.from || frame;
      uniforms.poseAtlas.value = frame.map;
      uniforms.previousAtlas.value = from.map;
      rect(uniforms.rectCurrent.value, frame, frame.row);
      rect(uniforms.rectNext.value, frame, frame.next);
      rect(uniforms.rectPrevious.value, from, from.row);
      rect(uniforms.rectPreviousNext.value, from, from.next);
      uniforms.frameMix.value = frame.mix;
      uniforms.previousMix.value = from.mix;
      uniforms.transitionMix.value = weight;
      uniforms.frameScale.value = 1.4 / frame.factor;
      uniforms.previousScale.value = 1.4 / from.factor;
      if (weight >= 1) transition = null;
      return { mix, transitionMix: weight, sequence: key !== "idle" };
    },
  };
}
