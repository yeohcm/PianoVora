import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '@/features/ui/ThemeProvider';
import { useAppStore } from '@/store/appStore';

function getCSSVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name);
}

beforeEach(() => {
  useAppStore.setState({ theme: 'cyber' });
  // Clear any CSS vars from previous tests
  document.documentElement.style.removeProperty('--neon-white-key');
  document.documentElement.style.removeProperty('--neon-black-key');
  document.documentElement.style.removeProperty('--glow-colour');
  document.documentElement.style.removeProperty('--neon-accent');
});

describe('ThemeProvider', () => {
  it('renders children unchanged', () => {
    const { getByText } = render(
      <ThemeProvider><span>hello</span></ThemeProvider>,
    );
    expect(getByText('hello')).toBeTruthy();
  });

  describe('cyber theme (default)', () => {
    it('sets --neon-white-key to #00f3ff', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      expect(getCSSVar('--neon-white-key')).toBe('#00f3ff');
    });

    it('sets --neon-black-key to #b300ff', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      expect(getCSSVar('--neon-black-key')).toBe('#b300ff');
    });

    it('sets --glow-colour to #00f3ff', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      expect(getCSSVar('--glow-colour')).toBe('#00f3ff');
    });

    it('sets --neon-accent to #00f3ff', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      expect(getCSSVar('--neon-accent')).toBe('#00f3ff');
    });
  });

  describe('aurora theme', () => {
    it('updates all CSS vars when theme changes to aurora', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      act(() => { useAppStore.getState().setTheme('aurora'); });
      expect(getCSSVar('--neon-white-key')).toBe('#39ff14');
      expect(getCSSVar('--neon-black-key')).toBe('#00e5ff');
      expect(getCSSVar('--glow-colour')).toBe('#39ff14');
      expect(getCSSVar('--neon-accent')).toBe('#39ff14');
    });
  });

  describe('sunset theme', () => {
    it('updates all CSS vars when theme changes to sunset', () => {
      render(<ThemeProvider><div /></ThemeProvider>);
      act(() => { useAppStore.getState().setTheme('sunset'); });
      expect(getCSSVar('--neon-white-key')).toBe('#ff6b35');
      expect(getCSSVar('--neon-black-key')).toBe('#ff2d78');
      expect(getCSSVar('--glow-colour')).toBe('#ff6b35');
      expect(getCSSVar('--neon-accent')).toBe('#ff6b35');
    });
  });

  it('updates CSS vars again when theme switches back to cyber', () => {
    render(<ThemeProvider><div /></ThemeProvider>);
    act(() => { useAppStore.getState().setTheme('aurora'); });
    act(() => { useAppStore.getState().setTheme('cyber'); });
    expect(getCSSVar('--neon-white-key')).toBe('#00f3ff');
  });
});
