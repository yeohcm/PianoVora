# Performance Test Instructions

## Performance Requirements
- **Audio Thread Latency**: Interactive audio context creation (< 20ms) using monophonic tone oscillator.
- **Render Loop Frame Rate**: Target consistent 60fps for note visualizer canvas rendering.
- **GC Overhead**: Ensure zero object reallocation on animation frames to avoid visual stutters.

## Run Verification
Manually trace frame updates using Chrome DevTools Performance tab to confirm no major layout shifts or long tasks.
