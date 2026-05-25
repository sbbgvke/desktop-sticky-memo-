import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Palette, Trash2, X } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  isDone: boolean;
  timestamp: string;
  priority?: number;
}

interface CollapseState {
  collapsed: boolean;
  edge: string | null;
}

interface Theme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  text: string;
  onPrimary: string;
  star: string;
}

const text = {
  title: '\u684c\u9762\u5907\u5fd8\u5f55',
  addPlaceholder: '\u6dfb\u52a0\u65b0\u5907\u5fd8...',
  add: '\u6dfb\u52a0',
  todo: '\u4ee3\u529e\u4e8b\u9879',
  done: '\u5b8c\u6210\u4e8b\u9879',
  emptyTodo: '\u6682\u65e0\u4ee3\u529e\u4e8b\u9879',
  emptyDone: '\u8fd8\u6ca1\u6709\u5b8c\u6210\u7684\u4e8b\u9879',
  deleteRecord: '\u5220\u9664\u8bb0\u5f55',
  priority: '\u91cd\u8981\u7b49\u7ea7',
  theme: '\u76ae\u80a4',
  handleShort: '\u5907\u5fd8',
  handleLong: '\u5907\u5fd8\u5f55',
};

const defaultNotes: Note[] = [
  {
    id: '1',
    text: '\u6574\u7406\u4e0b\u5468\u529f\u80fd\u5f00\u53d1\u6e05\u5355',
    isDone: false,
    timestamp: '2026-05-25 10:00',
    priority: 2,
  },
  {
    id: '2',
    text: '\u9605\u8bfb\u300a\u8bbe\u8ba1\u5fc3\u7406\u5b66\u300b',
    isDone: false,
    timestamp: '2026-05-25 11:30',
    priority: 1,
  },
  {
    id: '3',
    text: '\u4e0a\u5348 10:00 \u9700\u6c42\u8bc4\u5ba1\u4f1a\u8bae',
    isDone: true,
    timestamp: '2026-05-24 16:20',
    priority: 3,
  },
];

const themes: Theme[] = [
  {
    id: 'deep-teal',
    label: '\u84dd\u7070\u6df1\u9752',
    primary: '#08607c',
    secondary: '#a7c7c8',
    text: '#073d4f',
    onPrimary: '#e8f7f7',
    star: '#08607c',
  },
  {
    id: 'klein-yellow',
    label: '\u514b\u83b1\u56e0\u84dd + \u96c5\u9ec4',
    primary: '#012478',
    secondary: '#ffcf00',
    text: '#041f62',
    onPrimary: '#ffcf00',
    star: '#ffcf00',
  },
  {
    id: 'orange-navy',
    label: '\u7231\u9a6c\u4ed5\u6a59 + \u6df1\u6f9c',
    primary: '#ff770f',
    secondary: '#000026',
    text: '#080828',
    onPrimary: '#fff1e5',
    star: '#ff770f',
  },
  {
    id: 'tiffany-yellow',
    label: '\u8482\u8299\u5c3c\u84dd + \u6de1\u9ec4',
    primary: '#66d2c2',
    secondary: '#ffde9b',
    text: '#17665e',
    onPrimary: '#fff7d8',
    star: '#17665e',
  },
  {
    id: 'naples-green',
    label: '\u90a3\u4e0d\u52d2\u9ec4 + \u66d9\u7eff',
    primary: '#f8cb1d',
    secondary: '#19663c',
    text: '#14502f',
    onPrimary: '#14502f',
    star: '#19663c',
  },
  {
    id: 'mars-gold',
    label: '\u9a6c\u5c14\u65af\u7eff + \u54d1\u91d1',
    primary: '#009291',
    secondary: '#fad7be',
    text: '#00615f',
    onPrimary: '#ffe8d6',
    star: '#009291',
  },
  {
    id: 'peacock-purple',
    label: '\u5b54\u96c0\u84dd + \u85e4\u841d\u7d2b',
    primary: '#07b0c9',
    secondary: '#e07898',
    text: '#07546b',
    onPrimary: '#ffffff',
    star: '#07b0c9',
  },
  {
    id: 'pastel-blue-earth',
    label: '\u6de1\u84dd + \u6de1\u571f\u9ec4',
    primary: '#85caeb',
    secondary: '#f0e1cd',
    text: '#356b82',
    onPrimary: '#ffffff',
    star: '#4c99bd',
  },
  {
    id: 'healing-yellow',
    label: '\u6674\u7a7a\u5929\u84dd + \u8f6f\u7cd6\u5976\u9ec4',
    primary: '#0081ff',
    secondary: '#fef99d',
    text: '#006bd6',
    onPrimary: '#fef99d',
    star: '#0081ff',
  },
];

const NOTES_STORAGE_KEY = 'desktop_memos_v2';
const THEME_STORAGE_KEY = 'desktop_memos_theme';

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function alpha(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPriority(note: Note) {
  return Math.max(0, Math.min(3, note.priority ?? 0));
}

function sortByPriority(notes: Note[]) {
  return [...notes].sort((a, b) => getPriority(b) - getPriority(a));
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return themes.find((theme) => theme.id === saved) ?? themes[0];
}

function playCoinSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.setValueAtTime(0.001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
  master.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.36);
  master.connect(context.destination);

  [
    { frequency: 1046.5, start: 0, duration: 0.11 },
    { frequency: 1568, start: 0.08, duration: 0.16 },
  ].forEach(({ frequency, start, duration }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.12, context.currentTime + start + duration);
    gain.gain.setValueAtTime(0.001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.8, context.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.02);
  });

  window.setTimeout(() => context.close(), 500);
}

export default function App() {
  return (
    <div className="relative h-screen w-screen bg-transparent overflow-hidden">
      <MemoWidget />
    </div>
  );
}

function MemoWidget() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!saved) return defaultNotes;

    try {
      return JSON.parse(saved);
    } catch {
      return defaultNotes;
    }
  });
  const [inputText, setInputText] = useState('');
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [collapseState, setCollapseState] = useState<CollapseState>({
    collapsed: false,
    edge: null,
  });

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  }, [theme]);

  useEffect(() => {
    return window.desktopMemo?.onCollapsedChange(setCollapseState);
  }, []);

  useEffect(() => {
    if (!isDraggingWindow) return;

    const handleMove = (event: globalThis.MouseEvent) => {
      window.desktopMemo?.moveDrag({ screenX: event.screenX, screenY: event.screenY });
    };
    const handleEnd = () => {
      window.desktopMemo?.endDrag();
      setIsDraggingWindow(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('mouseleave', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('mouseleave', handleEnd);
    };
  }, [isDraggingWindow]);

  const getCurrentTime = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const startWindowDrag = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select, a, .no-window-drag')) {
      return;
    }

    window.desktopMemo?.startDrag({ screenX: event.screenX, screenY: event.screenY });
    setIsDraggingWindow(true);
  };

  const handleAdd = () => {
    if (!inputText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isDone: false,
      timestamp: getCurrentTime(),
      priority: 0,
    };
    setNotes([newNote, ...notes]);
    setInputText('');
  };

  const toggleDone = (id: string) => {
    const target = notes.find((note) => note.id === id);
    if (target && !target.isDone) {
      playCoinSound();
    }
    setNotes(notes.map((note) => (note.id === id ? { ...note, isDone: !note.isDone } : note)));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const updatePriority = (id: string, priority: number) => {
    setNotes(
      notes.map((note) =>
        note.id === id
          ? { ...note, priority: note.priority === priority ? 0 : priority }
          : note,
      ),
    );
  };

  const chooseTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    setIsThemePanelOpen(false);
  };

  const todos = sortByPriority(notes.filter((note) => !note.isDone));
  const dones = sortByPriority(notes.filter((note) => note.isDone));

  if (collapseState.collapsed) {
    return <CollapsedHandle edge={collapseState.edge} theme={theme} onMouseDown={startWindowDrag} />;
  }

  return (
    <motion.div
      onMouseDown={startWindowDrag}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="absolute inset-[7px] rounded-[10px] shadow-[0_14px_30px_-10px_rgba(5,55,72,0.44)] flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${alpha(theme.secondary, 0.96)} 0%, ${alpha(theme.primary, 0.9)} 52%, ${alpha(theme.primary, 0.98)} 100%)`,
        backdropFilter: 'blur(18px)',
        border: `1px solid ${alpha(theme.secondary, 0.7)}`,
        color: theme.text,
      }}
    >
      <div className="h-[42px] shrink-0 flex items-center justify-between px-3 cursor-move select-none border-b border-white/20 bg-white/10">
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-[5px] shadow-sm flex items-center justify-center"
            style={{ backgroundColor: theme.primary }}
          >
            <Check size={13} strokeWidth={3} style={{ color: theme.onPrimary }} />
          </div>
          <span className="text-[13px] font-semibold tracking-wide" style={{ color: theme.text }}>
            {text.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsThemePanelOpen((open) => !open)}
            className="no-window-drag h-[26px] w-[64px] flex items-center justify-center gap-1 rounded-[7px] border text-[12px] font-semibold shadow-sm transition-transform hover:scale-[1.03] active:scale-95 cursor-default"
            style={{
              backgroundColor: 'rgba(255,255,255,0.82)',
              borderColor: alpha(theme.primary, 0.55),
              color: theme.text,
            }}
            title={text.theme}
          >
            <span
              className="h-[12px] w-[12px] rounded-full border border-white/70"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0 50%, ${theme.secondary} 50% 100%)`,
              }}
            />
            <Palette size={12} />
            <span>{text.theme}</span>
          </button>
          <button
            onClick={() => window.desktopMemo?.closeWindow()}
            className="no-window-drag w-[30px] h-[24px] flex items-center justify-center rounded-[5px] hover:bg-[#c73737] hover:text-white transition-colors group cursor-default"
            style={{ color: alpha(theme.text, 0.72) }}
          >
            <X size={14} className="group-hover:stroke-white transition-colors" />
          </button>
        </div>
      </div>

      {isThemePanelOpen && (
        <ThemePicker activeThemeId={theme.id} onChoose={chooseTheme} />
      )}

      <div className="px-4 py-3 shrink-0 flex gap-2 items-center">
        <input
          type="text"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleAdd()}
          placeholder={text.addPlaceholder}
          className="no-window-drag flex-1 border rounded-[7px] py-2 px-3 text-[13px] outline-none shadow-sm transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.86)',
            borderColor: alpha(theme.secondary, 0.52),
            color: theme.text,
          }}
        />
        <button
          onClick={handleAdd}
          className="no-window-drag shrink-0 font-medium text-[13px] px-4 py-2 rounded-[7px] shadow-sm transition-all active:scale-95"
          style={{ backgroundColor: theme.primary, color: theme.onPrimary }}
        >
          {text.add}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 custom-scrollbar">
        <TaskSection title={text.todo} theme={theme}>
          <AnimatePresence mode="popLayout">
            {todos.map((note) => (
              <TaskCard
                key={note.id}
                note={note}
                isDone={false}
                theme={theme}
                onToggle={toggleDone}
                onDelete={deleteNote}
                onPriorityChange={updatePriority}
              />
            ))}
          </AnimatePresence>
          {todos.length === 0 && <EmptyText theme={theme}>{text.emptyTodo}</EmptyText>}
        </TaskSection>

        <TaskSection title={text.done} theme={theme}>
          <AnimatePresence mode="popLayout">
            {dones.map((note) => (
              <TaskCard
                key={note.id}
                note={note}
                isDone
                theme={theme}
                onToggle={toggleDone}
                onDelete={deleteNote}
                onPriorityChange={updatePriority}
              />
            ))}
          </AnimatePresence>
          {dones.length === 0 && <EmptyText theme={theme}>{text.emptyDone}</EmptyText>}
        </TaskSection>
      </div>
    </motion.div>
  );
}

function ThemePicker({
  activeThemeId,
  onChoose,
}: {
  activeThemeId: string;
  onChoose: (theme: Theme) => void;
}) {
  return (
    <div className="no-window-drag absolute right-3 top-[48px] z-20 w-[250px] rounded-[10px] border border-white/45 bg-white/90 p-2 shadow-[0_12px_28px_rgba(5,55,72,0.24)] backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChoose(theme)}
            className="h-[42px] rounded-[8px] border p-1 transition-transform hover:scale-[1.03]"
            style={{
              borderColor: activeThemeId === theme.id ? theme.primary : 'rgba(7,61,79,0.14)',
              background: `linear-gradient(90deg, ${theme.primary} 0 50%, ${theme.secondary} 50% 100%)`,
              boxShadow: activeThemeId === theme.id ? `0 0 0 2px ${alpha(theme.primary, 0.18)}` : 'none',
            }}
            title={theme.label}
          >
            <span className="sr-only">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskSection({ title, theme, children }: { title: string; theme: Theme; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold mb-2.5 pl-1 tracking-wide" style={{ color: alpha(theme.text, 0.72) }}>
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function EmptyText({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <div className="text-[12px] pl-1 pt-1" style={{ color: alpha(theme.text, 0.48) }}>
      {children}
    </div>
  );
}

function TaskCard({
  note,
  isDone,
  theme,
  onToggle,
  onDelete,
  onPriorityChange,
}: {
  key?: string;
  note: Note;
  isDone: boolean;
  theme: Theme;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: number) => void;
}) {
  const priority = getPriority(note);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: isDone ? -5 : 5, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(2px)' }}
      className="rounded-[8px] p-2.5 shadow-sm border flex items-start flex-col gap-1.5 transition-all group"
      style={{
        background: isDone ? 'rgba(232,244,244,0.72)' : 'rgba(255,255,255,0.88)',
        borderColor: isDone ? 'rgba(255,255,255,0.24)' : alpha(theme.secondary, 0.62),
      }}
    >
      <div className="flex items-center w-full gap-2.5">
        <button
          onClick={() => onToggle(note.id)}
          className="no-window-drag w-[15px] h-[15px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-sm"
          style={{
            background: isDone ? alpha(theme.primary, 0.2) : 'rgba(255,255,255,0.82)',
            borderColor: isDone ? 'transparent' : alpha(theme.primary, 0.35),
            color: theme.primary,
          }}
        >
          {isDone && <Check size={10} strokeWidth={3} />}
        </button>
        <span className="text-[10.5px] font-medium" style={{ color: alpha(theme.text, isDone ? 0.3 : 0.5) }}>
          {note.timestamp}
        </span>
        <PriorityStars
          value={priority}
          isDone={isDone}
          theme={theme}
          onChange={(nextPriority) => onPriorityChange(note.id, nextPriority)}
        />
        {isDone && (
          <button
            onClick={() => onDelete(note.id)}
            className="no-window-drag ml-auto opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 hover:bg-white/50 rounded-[4px] transition-all"
            style={{ color: alpha(theme.text, 0.38) }}
            title={text.deleteRecord}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div
        className={`pl-6 text-[13px] leading-[1.6] break-words w-full ${isDone ? 'line-through' : 'font-medium'}`}
        style={{ color: alpha(theme.text, isDone ? 0.46 : 0.95) }}
      >
        {note.text}
      </div>
    </motion.div>
  );
}

function PriorityStars({
  value,
  isDone,
  theme,
  onChange,
}: {
  value: number;
  isDone: boolean;
  theme: Theme;
  onChange: (priority: number) => void;
}) {
  return (
    <div className="no-window-drag flex items-center gap-[1px]" title={text.priority}>
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className="h-[16px] w-[14px] leading-none text-[12px] transition-transform hover:scale-110"
          style={{
            color: level <= value
              ? isDone ? alpha(theme.star, 0.4) : theme.star
              : alpha(theme.text, 0.22),
          }}
          aria-label={`\u8bbe\u7f6e\u4e3a ${level} \u661f\u91cd\u8981\u7b49\u7ea7`}
        >
          {'\u2605'}
        </button>
      ))}
    </div>
  );
}

function CollapsedHandle({
  edge,
  theme,
  onMouseDown,
}: {
  edge: string | null;
  theme: Theme;
  onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void;
}) {
  const isVertical = edge === 'left' || edge === 'right';

  return (
    <motion.div
      onMouseDown={onMouseDown}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full w-full cursor-move select-none overflow-hidden shadow-[0_8px_24px_rgba(5,55,72,0.25)]"
      style={{
        background: `linear-gradient(135deg, ${alpha(theme.secondary, 0.98)} 0%, ${alpha(theme.primary, 0.98)} 100%)`,
        backdropFilter: 'blur(14px)',
        border: `1px solid ${alpha(theme.secondary, 0.55)}`,
        borderRadius:
          edge === 'left'
            ? '0 12px 12px 0'
            : edge === 'right'
              ? '12px 0 0 12px'
              : edge === 'bottom'
                ? '12px 12px 0 0'
                : '0 0 12px 12px',
      }}
    >
      <div className="h-full w-full flex items-center justify-center font-semibold text-[13px] tracking-wide" style={{ color: theme.text }}>
        <span style={{ writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb' }}>
          {isVertical ? text.handleShort : text.handleLong}
        </span>
      </div>
    </motion.div>
  );
}
