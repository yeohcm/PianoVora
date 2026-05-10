import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoteHistoryPanel from '@/features/ui/NoteHistoryPanel';
import type { DetectedNote } from '@/shared/types';

function makeNote(noteName: string, octave: number, i = 0): DetectedNote {
  return {
    midiNote: 60 + i,
    keyIndex: i,
    noteName,
    octave,
    frequency: 440,
    clarity: 1,
    timestamp: Date.now(),
  };
}

describe('NoteHistoryPanel', () => {
  it('renders with landmark role and aria-label', () => {
    render(<NoteHistoryPanel notes={[]} />);
    expect(screen.getByRole('region', { name: 'Note history' })).toBeInTheDocument();
  });

  it('shows empty state when notes array is empty', () => {
    render(<NoteHistoryPanel notes={[]} />);
    expect(screen.getByTestId('history-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Play a note to see history')).toBeInTheDocument();
  });

  it('hides empty state when notes are present', () => {
    render(<NoteHistoryPanel notes={[makeNote('C', 4)]} />);
    expect(screen.queryByTestId('history-empty-state')).not.toBeInTheDocument();
  });

  it('renders note name and octave for a single note', () => {
    render(<NoteHistoryPanel notes={[makeNote('C', 4)]} />);
    expect(screen.getByTestId('history-item-0')).toHaveTextContent('C4');
  });

  it('renders up to 5 notes with correct testids', () => {
    const notes = [
      makeNote('C', 4, 0),
      makeNote('D', 4, 1),
      makeNote('E', 4, 2),
      makeNote('F', 4, 3),
      makeNote('G', 4, 4),
    ];
    render(<NoteHistoryPanel notes={notes} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`history-item-${i}`)).toBeInTheDocument();
    }
  });

  it('applies decreasing opacity to successive notes', () => {
    const notes = [makeNote('C', 4, 0), makeNote('D', 4, 1), makeNote('E', 4, 2)];
    render(<NoteHistoryPanel notes={notes} />);
    const item0 = screen.getByTestId('history-item-0');
    const item1 = screen.getByTestId('history-item-1');
    const item2 = screen.getByTestId('history-item-2');
    expect(item0).toHaveStyle({ opacity: '1' });
    expect(item1).toHaveStyle({ opacity: '0.85' });
    expect(item2).toHaveStyle({ opacity: '0.7' });
  });

  it('renders history label text', () => {
    render(<NoteHistoryPanel notes={[]} />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });
});
