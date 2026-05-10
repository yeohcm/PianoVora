import { ThemeProvider } from './features/ui/ThemeProvider';
import AppLayout from './features/ui/AppLayout';

export default function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
