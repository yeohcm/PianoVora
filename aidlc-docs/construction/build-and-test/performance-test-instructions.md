# Performance Test Instructions

## Purpose
Validate client-side latency and animation execution metrics to ensure an interactive, high-fidelity experience.

## Performance Requirements
- **Audio Latency**: < 50ms from trigger gesture (mouse click/touch start) to audio playback node generation.
- **Rendering Throughput**: Main keyboard interface and canvas layers must render updates at 60 FPS under normal interaction loads.
- **Memory Footprint**: Active note triggers must cleanly release oscillator nodes to prevent browser tab crashes due to node leaks.

## Run Performance Tests

### 1. Audio Latency Inspection
1. Open Chrome DevTools.
2. Select the **Performance** tab.
3. Record a session while clicking virtual keys in Synth mode.
4. Verify that Web Audio API processing does not block the main JS thread for more than 16ms (1 frame).

### 2. Memory Footprint Auditing
1. Open Chrome DevTools **Memory** panel.
2. Click multiple virtual keys consecutively to generate synthesis sounds.
3. Trigger Garbage Collection (trash bin icon).
4. Verify that `OscillatorNode` and `GainNode` references are garbage-collected and do not leak over time.
