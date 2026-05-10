# Unit 1: Audio Engine — Business Logic Model

---

## Flow 1: Initialisation (First Visit)

```
App mounts
  → check uiSlice.onboardingDismissed
  → if false (first visit):
      → render OnboardingModal (Unit 4)
      → user clicks "Get Started"
      → OnboardingModal calls dismissOnboarding() → sets onboardingDismissed = true
      → useAudioEngine.requestPermission() is called
  → if true (repeat visit):
      → useAudioEngine.requestPermission() is called immediately on hook mount
```

---

## Flow 2: Permission Request

```
requestPermission()
  → set permissionState = 'prompt'
  → call navigator.mediaDevices.getUserMedia({ audio: true })

  SUCCESS path:
    → MediaStream returned
    → set permissionState = 'granted'
    → call setupAudioContext(stream)

  DENIED path:
    → NotAllowedError thrown
    → set permissionState = 'denied'
    → store analyserNode ref = null
    → (ErrorBanner rendered by Unit 4; demo mode remains functional)

  OTHER ERROR path (device not found, etc.):
    → set permissionState = 'error'
    → store analyserNode ref = null
    → (ErrorBanner rendered)
```

---

## Flow 3: Audio Context Setup

```
setupAudioContext(stream: MediaStream)
  → create AudioContext (browser default sample rate, min 44100 Hz)
  → create AnalyserNode:
      fftSize = 2048
      smoothingTimeConstant = 0  (raw data; pitchy handles smoothing)
  → create MediaStreamSourceNode from stream
  → connect: MediaStreamSourceNode → AnalyserNode
      (AnalyserNode is NOT connected to AudioContext.destination — no audio playback)
  → store analyserNode ref (exposed to usePitchDetector)
  → set isListening = true
  → register dropout listeners:
      audioContext.onstatechange → handleContextStateChange()
      stream.getTracks()[0].onended → handleTrackEnded()
  → start RMS animation loop
```

---

## Flow 4: RMS Level Calculation Loop (per animation frame ~60fps)

```
rmsLoop(animationFrameId)
  → analyserNode.getFloatTimeDomainData(buffer)   // Float32Array[2048]
  → rms = sqrt( sum(x² for x in buffer) / buffer.length )
  → smoothedLevel = 0.3 * rms + 0.7 * prevSmoothedLevel   // EMA, α=0.3
  → set audioLevel = smoothedLevel
  → animationFrameId = requestAnimationFrame(rmsLoop)
```

---

## Flow 5: Stop (User-Initiated)

```
stop()
  → set userIntentStopped = true   (internal flag, prevents reconnect logic)
  → cancelAnimationFrame(animationFrameId)
  → audioContext.suspend()
  → set isListening = false
  → set audioLevel = 0
  (stream and AnalyserNode kept alive — allows fast resume without re-requesting permission)
```

---

## Flow 6: Resume (User-Initiated)

```
start() — called when user clicks MicToggle while stopped
  → if permissionState !== 'granted' → call requestPermission() instead
  → set userIntentStopped = false
  → audioContext.resume()
  → set isListening = true
  → restart RMS loop
```

---

## Flow 7a: Auto-Reconnect — System Interruption (onstatechange)

```
handleContextStateChange()
  → if userIntentStopped === true → return (ignore — user manually stopped)
  → if audioContext.state === 'suspended' OR 'interrupted':
      → reconnectStart = performance.now()
      → attempt audioContext.resume()
      → poll every 100ms for up to 1000ms:
          → if audioContext.state === 'running':
              → set isListening = true
              → restart RMS loop
              → return
          → if 1000ms elapsed without success:
              → set permissionState = 'error'
              → set isListening = false
              → return
```

---

## Flow 7b: Auto-Reconnect — Hardware Disconnect (onended)

```
handleTrackEnded()
  → if userIntentStopped === true → return
  → reconnectStart = performance.now()
  → cancelAnimationFrame(animationFrameId)
  → stop all tracks on old stream (stream.getTracks().forEach(t => t.stop()))
  → wait 200ms (device stabilisation)
  → call getUserMedia({ audio: true }):

      SUCCESS:
        → create new MediaStreamSourceNode from new stream
        → disconnect old source from AnalyserNode
        → connect new source to existing AnalyserNode
        → register new track.onended listener
        → if (performance.now() - reconnectStart) < 1000ms:
            → set isListening = true
            → restart RMS loop
        → else:
            → set permissionState = 'error'
            → set isListening = false

      FAILURE (> 1000ms total or permission denied):
        → set permissionState = 'error'
        → set isListening = false
```

---

## Flow 8: Cleanup (Component Unmount)

```
useEffect cleanup
  → set userIntentStopped = true
  → cancelAnimationFrame(animationFrameId)
  → stream.getTracks().forEach(t => t.stop())
  → audioContext.close()
  → analyserNode ref = null
```
