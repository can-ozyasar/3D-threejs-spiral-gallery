// GLSL pair for the spiral's curved empty cards.
// Vertex shader hands the fragment shader the tile UV and a world-space
// position; the fragment paints a quiet glass card with edge falloff and
// a soft depth wash so tiles far from the camera sink into the bg.

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uCameraPosition;
  uniform vec3 uCardColor;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    // Soft vignette around each tile.
    vec2 centered = vUv - 0.5;
    float r = length(centered);
    float edge = 1.0 - smoothstep(0.34, 0.86, r);
    edge = mix(0.78, 1.0, edge);

    // Distance from camera → depth fade.
    float dist = distance(vWorldPosition, uCameraPosition);
    float depth = 1.0 - smoothstep(8.0, 22.0, dist);
    depth = mix(0.48, 1.0, depth);

    // Empty card surface: subtle fill, visible border, no photo texture.
    float borderX = 1.0 - smoothstep(0.0, 0.035, min(vUv.x, 1.0 - vUv.x));
    float borderY = 1.0 - smoothstep(0.0, 0.055, min(vUv.y, 1.0 - vUv.y));
    float border = max(borderX, borderY);

    float shine = smoothstep(0.18, 0.82, vUv.x) * (1.0 - smoothstep(0.52, 1.0, vUv.y));
    vec3 base = mix(vec3(0.035, 0.033, 0.03), uCardColor, 0.34 + 0.22 * shine);
    vec3 color = mix(base, vec3(1.0, 0.86, 0.58), border * 0.38);

    color *= edge * depth;

    float alpha = mix(0.18, 0.46, depth) + border * 0.22;
    gl_FragColor = vec4(color, alpha);
  }
`;
