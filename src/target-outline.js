import { Color, Vector4 } from "three";

// One pass on the existing sprite: the contour samples only this packed frame.
// Screen derivatives keep its width steady as the camera and resolution change.
export function installTargetOutline(material) {
  const uniforms = {
    targetSelected: { value: 0 },
    targetWidth: { value: 3 },
    targetColor: { value: new Color("#ff3028") },
    targetFrame: { value: new Vector4(0, 0, 1, 1) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_pars_fragment>",
      `#include <map_pars_fragment>
      uniform float targetSelected;
      uniform float targetWidth;
      uniform vec3 targetColor;
      uniform vec4 targetFrame;
      float targetAlpha(vec2 uv) {
        if (any(lessThan(uv, targetFrame.xy)) ||
            any(greaterThan(uv, targetFrame.zw))) return 0.0;
        return texture2D(map, uv).a;
      }`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      if (targetSelected > 0.5) {
        if (any(lessThan(vMapUv, targetFrame.xy)) ||
            any(greaterThan(vMapUv, targetFrame.zw))) diffuseColor.a = 0.0;
        vec2 dx = dFdx(vMapUv) * targetWidth;
        vec2 dy = dFdy(vMapUv) * targetWidth;
        float bodyAlpha = diffuseColor.a;
        float hi = diffuseColor.a;
        for (int i = 0; i < 8; i++) {
          float angle = float(i) * 0.78539816339;
          vec2 stepUv = dx * cos(angle) + dy * sin(angle);
          hi = max(hi, targetAlpha(vMapUv + stepUv));
          hi = max(hi, targetAlpha(vMapUv + stepUv * 0.5));
        }
        diffuseColor.rgb = mix(targetColor, diffuseColor.rgb, bodyAlpha);
        diffuseColor.a = hi;
      }`,
    );
  };
  material.customProgramCacheKey = () => "emberfall-target-contour-v1";
  return uniforms;
}
