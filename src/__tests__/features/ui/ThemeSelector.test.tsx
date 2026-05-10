import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeSelector } from '@/features/ui/ThemeSelector';
import { useAppStore } from '@/store/appStore';

beforeEach(() => {
  useAppStore.setState({ theme: 'cyber' });
});

describe('ThemeSelector', () => {
  it('renders all four theme buttons', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-btn-cyber')).toBeTruthy();
    expect(screen.getByTestId('theme-btn-aurora')).toBeTruthy();
    expect(screen.getByTestId('theme-btn-sunset')).toBeTruthy();
    expect(screen.getByTestId('theme-btn-rainbow')).toBeTruthy();
  });

  it('renders wrapper with role="group" and aria-label="Colour theme"', () => {
    render(<ThemeSelector />);
    const group = screen.getByRole('group', { name: 'Colour theme' });
    expect(group).toBeTruthy();
    expect(group.getAttribute('data-testid')).toBe('theme-selector');
  });

  it('active theme button has aria-pressed="true"', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-btn-cyber').getAttribute('aria-pressed')).toBe('true');
  });

  it('inactive theme buttons have aria-pressed="false"', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-btn-aurora').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('theme-btn-sunset').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('theme-btn-rainbow').getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking aurora button calls setTheme("aurora")', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByTestId('theme-btn-aurora'));
    expect(useAppStore.getState().theme).toBe('aurora');
  });

  it('clicking sunset button calls setTheme("sunset")', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByTestId('theme-btn-sunset'));
    expect(useAppStore.getState().theme).toBe('sunset');
  });

  it('active button updates when theme changes', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByTestId('theme-btn-aurora'));
    expect(screen.getByTestId('theme-btn-aurora').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('theme-btn-cyber').getAttribute('aria-pressed')).toBe('false');
  });

  it('displays correct button labels', () => {
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-btn-cyber').textContent).toBe('Cyber');
    expect(screen.getByTestId('theme-btn-aurora').textContent).toBe('Aurora');
    expect(screen.getByTestId('theme-btn-sunset').textContent).toBe('Sunset');
    expect(screen.getByTestId('theme-btn-rainbow').textContent).toBe('Rainbow');
  });

  it('clicking rainbow button sets theme to rainbow', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByTestId('theme-btn-rainbow'));
    expect(useAppStore.getState().theme).toBe('rainbow');
  });

  it('rainbow button shows aria-pressed="true" when active', () => {
    useAppStore.setState({ theme: 'rainbow' });
    render(<ThemeSelector />);
    expect(screen.getByTestId('theme-btn-rainbow').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('theme-btn-cyber').getAttribute('aria-pressed')).toBe('false');
  });
});
