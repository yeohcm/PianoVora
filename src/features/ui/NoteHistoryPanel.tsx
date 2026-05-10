import type { DetectedNote } from '@/shared/types';

interface NoteHistoryPanelProps {
  notes: DetectedNote[];
}

export default function NoteHistoryPanel({ notes }: NoteHistoryPanelProps) {
  return (
    <section
      aria-label="Note history"
      className="px-4 py-3 border-t border-white/10 flex items-center gap-4"
      data-testid="note-history-panel"
    >
      <span className="text-xs text-white/40 uppercase tracking-widest shrink-0">
        History
      </span>

      {notes.length === 0 ? (
        <span
          className="text-sm text-white/30 italic"
          data-testid="history-empty-state"
        >
          Play a note to see history
        </span>
      ) : (
        <ol className="flex gap-3 list-none">
          {notes.map((note, i) => (
            <li
              key={i}
              className="text-lg font-mono font-bold"
              style={{ opacity: 1 - i * 0.15 }}
              data-testid={`history-item-${i}`}
            >
              {note.noteName}{note.octave}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
