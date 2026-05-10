# Unit 1: Audio Engine — Frontend Components

---

## MicToggle

**Purpose**: Single button that starts and stops microphone listening. The entry point for the audio capture lifecycle.

### State Machine

```
         [Mount]
            |
            v
         [idle]
    permissionState='prompt'
    isListening=false
    Label: "Allow Microphone"
    Icon: mic-off
            |
            | user clicks
            v
       [requesting]
    permissionState='prompt'
    isListening=false
    Label: "Connecting..."
    Icon: spinner (animated)
    Button: disabled
            |
       +---------+
       |         |
   granted     denied/error
       |         |
       v         v
    [active]  [error]
  isListening=true   permissionState='denied'|'error'
  Label: "Stop"      Label: "Mic Unavailable"
  Icon: mic-on       Icon: mic-blocked
  Button: enabled    Button: disabled + tooltip
  Pulse animation    (see ErrorBanner for instructions)
       |
       | user clicks
       v
    [stopped]
  isListening=false
  permissionState='granted'
  Label: "Start"
  Icon: mic-off
  Button: enabled
       |
       | user clicks
       v
    [active]  (no permission request — AudioContext.resume())
```

### Props
```typescript
interface MicToggleProps {
  onStart: () => Promise<void>;   // calls useAudioEngine.start()
  onStop: () => void;             // calls useAudioEngine.stop()
}
// Reads from Zustand: isListening, permissionState
```

### Accessibility
- `aria-label` reflects current state: "Start listening", "Stop listening", "Microphone unavailable"
- `aria-pressed` reflects `isListening`
- Focusable via keyboard Tab; activated via Enter/Space

---

## AudioLevelMeter

**Purpose**: Animated horizontal (or vertical) bar showing real-time microphone signal strength. Confirms the mic is active and receiving signal. No numeric scale.

### Display Logic

```
Input: audioSlice.audioLevel (0.0–1.0, smoothed RMS)

Bar fill width = audioLevel * 100%   (linear mapping)

Peak indicator:
  → track peakLevel = max(audioLevel seen in last 500ms)
  → display peak marker at peakLevel position
  → after 500ms without new peak: peakLevel decays at 0.02/frame toward audioLevel

Colour:
  → isListening = true:  bar colour = var(--neon-white-key) (active theme accent)
  → isListening = false: bar colour = neutral grey (#555)

Inactive state:
  → isListening = false: bar width = 0%, peak marker hidden, no animation

Animation:
  → CSS transition on bar width: 50ms ease-out (smooth without lag)
  → Peak indicator uses CSS transition: 150ms ease-in-out
```

### Props
```typescript
interface AudioLevelMeterProps {
  orientation?: 'horizontal' | 'vertical';  // default: 'horizontal'
  height?: number;                           // default: 8px (horizontal)
}
// Reads from Zustand: audioLevel, isListening
```

### Accessibility
- `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label="Microphone level"`
- `aria-live="off"` (meter updates too frequently for announcements)

---

## SensitivitySlider

**Purpose**: Range input allowing the user to adjust how sensitive the app is to sound. Controls the noise gate threshold — higher sensitivity catches quieter notes but may also catch ambient noise.

### Display Logic

```
Input:  audioSlice.noiseGateThreshold (0.001–0.1)
Output: noiseGateThreshold written to store on change

Visual mapping (inverted for UX clarity):
  → slider left  = low sensitivity  = high threshold (0.1)  = "Quiet Only"
  → slider right = high sensitivity = low threshold (0.001) = "All Sounds"
  
  sliderValue = 1 - ((noiseGateThreshold - 0.001) / (0.1 - 0.001))
  (inverted so "right = more sensitive" matches user intuition)

Labels (no numeric values shown):
  → left label:  "Less Sensitive"
  → right label: "More Sensitive"

On change:
  → convert sliderValue back to threshold:
      threshold = 0.001 + (1 - sliderValue) * (0.1 - 0.001)
  → clamp to [0.001, 0.1]
  → call setNoiseGateThreshold(threshold)
  → update is real-time (no debounce needed — threshold is read per animation frame)
```

### Props
```typescript
// No external props — reads/writes directly from/to Zustand audioSlice
```

### Accessibility
- `<label>` element explicitly associated with the `<input type="range">`
- `aria-label="Microphone sensitivity"`
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` set to the slider position (0–100)
- `aria-valuetext` provides meaningful description: "Low sensitivity" / "Medium sensitivity" / "High sensitivity" based on thirds of the range

---

## Component Interaction Summary

```
User clicks MicToggle
  → [idle] or [stopped] → triggers useAudioEngine.start()
  → [active] → triggers useAudioEngine.stop()
  → [requesting] → no action (button disabled)
  → [error] → no action (button disabled)

useAudioEngine writes to audioSlice:
  → isListening     → MicToggle re-renders (label/icon change)
  → audioLevel      → AudioLevelMeter re-renders (bar width)
  → permissionState → MicToggle + ErrorBanner re-render
  → noiseGateThreshold (read by Unit 2; written by SensitivitySlider)

SensitivitySlider writes noiseGateThreshold → audioSlice
  → Unit 2 (usePitchDetector) reads it each frame — immediate effect
  → SensitivitySlider does NOT re-render from its own write
    (controlled input keeps slider position stable)
```
