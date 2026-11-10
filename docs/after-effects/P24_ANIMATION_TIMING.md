# MADEL Studio Bridge — Phase P24: Animation, Timing Math & Spatial Geometry
**Developed and maintained by Mahmoud Adel**

## 1. Overview

Motion graphics authoring requires mathematical rigor across temporal and spatial domains. Phase P24 incorporates `@madel/after-effects-adapter/timing-math.js` to ensure deterministic frame conversions, SMPTE timecode generation, and 2D/3D coordinate computations.

---

## 2. Broadcast Frame Rates & Conversion Math

MADEL Studio Bridge natively validates and operates across 8 standard industry frame rates:

$$\text{FPS} \in \{23.976, 24.0, 25.0, 29.97, 30.0, 50.0, 59.94, 60.0\}$$

### 2.1 Seconds to Whole Frames
$$\text{frameIndex} = \text{round}(\text{seconds} \times \text{FPS})$$

### 2.2 Exact Frame to Seconds
$$\text{seconds} = \frac{\text{frameIndex}}{\text{FPS}}$$

### 2.3 Temporal Quantization (Frame Snapping)
To prevent sub-frame jitter when keyframing via AI clients, timestamps are snapped to the nearest discrete video frame:
$$\text{snappedTime} = \frac{\text{round}(\text{time} \times \text{FPS})}{\text{FPS}}$$

---

## 3. SMPTE Timecode Formatting

### 3.1 Non-Drop-Frame (NDF) Timecode
Standard colon (`:`) separator format: `HH:MM:SS:FF`
- Hours ($HH$): $\lfloor \text{totalSeconds} / 3600 \rfloor$
- Minutes ($MM$): $\lfloor (\text{totalSeconds} \bmod 3600) / 60 \rfloor$
- Seconds ($SS$): $\text{totalSeconds} \bmod 60$
- Frames ($FF$): $\text{totalFrames} \bmod \text{round}(\text{FPS})$

### 3.2 Drop-Frame (DF) Timecode
Used for NTSC broadcast compatibility ($29.97\text{ FPS}$ and $59.94\text{ FPS}$) to eliminate wall-clock drift. Utilizes semicolon (`;`) frame separator: `HH:MM:SS;FF`.

---

## 4. Spatial Coordinate Math & Composition Bounds

After Effects comp coordinates originate at the top-left corner $(0, 0)$. Layer anchor points determine local transform pivots.

### 4.1 Normalized to Pixel Coordinate Mapping
When AI clients specify fractional viewport coordinates ($u, v \in [0.0, 1.0]$):

$$x = \text{round}(\text{compWidth} \times u)$$
$$y = \text{round}(\text{compHeight} \times v)$$

For 3D compositions, depth $z$ is preserved in world coordinates:

$$\vec{P}_{3D} = \begin{bmatrix} x \\ y \\ z \end{bmatrix}$$

Default center point for Full HD ($1920 \times 1080$):
$$\vec{P}_{\text{center}} = [960, 540]$$

---

## 5. Temporal Easing & Interpolation Types

Keyframe motion can be linear, stepped, or curved:

1. **`KeyframeInterpolationType.LINEAR`**: Constant velocity without acceleration or deceleration.
2. **`KeyframeInterpolationType.HOLD`**: Discrete value hold until the subsequent keyframe (instant stepping).
3. **`KeyframeInterpolationType.BEZIER`**: Smooth acceleration/deceleration utilizing Adobe's `KeyframeEase` construct:
   ```javascript
   var easeIn = new KeyframeEase(speed, influence);
   var easeOut = new KeyframeEase(speed, influence);
   prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
   ```
   Standard "Easy Ease" preset applies `influence = 33.333%` and `speed = 0`. MADEL dynamic motion presets apply `influence = 50%` and `speed = 0.5` for punchy motion graphics.
