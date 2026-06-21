import type { DetectedNote } from '@/shared/types';

interface NoteHistoryPanelProps {
  notes: DetectedNote[];
}

export default function NoteHistoryPanel({ notes }: NoteHistoryPanelProps) {
  return (
    <section
      aria-label="Note history"
      className="px-6 py-4 border-t border-white/10 backdrop-blur-md bg-[#0a0a0f]/60 flex items-center gap-6 shadow-2xl relative z-10"
      data-testid="note-history-panel"
    >
      {/* Background glow matching the theme */}
      <div 
        className="absolute inset-0 opacity-5 blur-2xl pointer-events-none transition-all duration-500"
        style={{
          background: notes.length > 0 
            ? 'radial-gradient(circle at bottom, var(--glow-colour) 0%, transparent 60%)' 
            : undefined
        }}
      />

      <span className="text-xs uppercase tracking-widest text-white/40 font-bold select-none shrink-0">
        History
      </span>

      {notes.length === 0 ? (
        <span
          className="text-sm text-white/30 font-medium select-none italic"
          data-testid="history-empty-state"
        >
          Play a note to see history
        </span>
      ) : (
        <ol className="flex gap-3 list-none overflow-x-auto py-1">
          {notes.map((note, i) => (
            <li
              key={i}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1 font-mono font-bold text-sm select-none transition-all duration-300 transform scale-100 hover:scale-105 hover:bg-white/10 active:scale-95 animate-fade-in-up"
              style={{ opacity: 1 - i * 0.15 }}
              data-testid={`history-item-${i}`}
            >
              <span className="text-white">{note.noteName}</span>
              <span className="text-white/60 text-xs font-light">{note.octave}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

