"""Stable matte and diffuse exposure for offline sprite animation baking."""
import cv2
import numpy as np


def exposure(rgba):
    # Opaque painted surfaces only: transparent padding never affects exposure.
    mask = rgba[:, :, 3] > 210
    colors = rgba[:, :, :3][mask].astype(np.float32)
    if len(colors) < 16:
        return np.ones(3, np.float32)
    return np.maximum(colors.mean(axis=0), 8)


def stabilize(rgba, target):
    result = rgba.copy()
    # Use one coverage convention for every authored/inferred frame. Interior
    # cloth, skin and metal are opaque; a narrow antialiased edge stays soft.
    silhouette = (rgba[:, :, 3] >= 104).astype(np.uint8) * 255
    result[:, :, 3] = cv2.GaussianBlur(silhouette, (3, 3), 0.45)
    # Neutral per-channel exposure matching preserves material detail, rather
    # than multiplying actor opacity or changing scene lights during playback.
    for _ in range(2):
        gain = np.clip(target / exposure(result), 0.72, 1.38)
        result[:, :, :3] = np.clip(result[:, :, :3].astype(np.float32) * gain, 0, 255).round().astype(np.uint8)
    result[result[:, :, 3] == 0, :3] = 0
    return result


def vary_pose(rgba, phase, variant, action, facing):
    """Anchored pose deformations; variants meet at the same loop/guard pose.

    These supply alternate weight/cape/upper-body motion to existing companion
    and creature keys, not new hand-painted frames or random frame shuffling.
    """
    if variant == 0:
        return rgba
    size = rgba.shape[0]
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    nx, ny = x / size, y / size
    sign = 1 if facing in (0, 3) else -1
    direction = 1 if variant == 1 else -1
    if action == 'walk':
        envelope = np.sin(phase * 2 * np.pi)
        lean = direction * sign * envelope * 0.024
        lift = (np.sin(phase * 2 * np.pi) ** 2) * (0.012 if variant == 1 else -0.008)
        # Boot anchor fixed; bent-knee weight transfer and shoulder counter-sway.
        upper = np.clip((0.91 - ny) / 0.6, 0, 1)
        dx = lean * upper + direction * 0.014 * np.sin(phase * 4 * np.pi) * np.maximum(0, ny - 0.48)
        dy = lift * upper
    else:
        envelope = np.sin(np.pi * phase) ** 2
        upper = np.clip((0.91 - ny) / 0.55, 0, 1)
        dx = direction * sign * envelope * 0.055 * upper
        # Different torso/arm arc with feet planted and unchanged contact clock.
        dy = direction * sign * envelope * (nx - 0.5) * 0.065 * upper
    # Premultiplied resampling prevents dark transparent borders bleeding in.
    z = rgba.astype(np.float32) / 255
    z[:, :, :3] *= z[:, :, 3:4]
    z = cv2.remap(z, (x - dx * size).astype(np.float32), (y - dy * size).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    z[:, :, :3] /= np.maximum(z[:, :, 3:4], 1 / 255)
    return np.clip(z * 255, 0, 255).round().astype(np.uint8)
