// Unit 1 stub — replaced by Unit 4's AppLayout composition
import MicToggle from './features/audio/MicToggle';
import AudioLevelMeter from './features/audio/AudioLevelMeter';
import SensitivitySlider from './features/audio/SensitivitySlider';
import { useAudioEngine } from './features/audio/useAudioEngine';

export default function App() {
  const { start, stop } = useAudioEngine();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>PianoVora</h1>
      <MicToggle onStart={start} onStop={stop} />
      <AudioLevelMeter />
      <SensitivitySlider />
    </div>
  );
}
