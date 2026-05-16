import { useState } from 'react';
import type { TaskItem } from '@/types/note.types';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tasks: TaskItem[];
  textColor: string;
  onChange: (tasks: TaskItem[]) => void;
}

export function TaskList({ tasks, textColor, onChange }: Props) {
  const [newText, setNewText] = useState('');

  const toggle = (id: string) =>
    onChange(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id: string) =>
    onChange(tasks.filter((t) => t.id !== id));

  const add = () => {
    if (!newText.trim()) return;
    onChange([...tasks, {
      id: `task-${Date.now()}`,
      text: newText.trim(),
      done: false,
    }]);
    setNewText('');
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-start gap-1.5 group">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => toggle(task.id)}
            className="mt-0.5 cursor-pointer accent-current flex-shrink-0"
          />
          <span
            className={cn('text-sm flex-1 break-words', task.done && 'line-through opacity-50')}
            style={{ color: textColor }}
          >
            {task.text}
          </span>
          <button
            onClick={() => remove(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={11} style={{ color: textColor }} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1 mt-1">
        <Plus size={12} style={{ color: textColor, opacity: 0.5 }} />
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add item…"
          className="bg-transparent text-sm flex-1 outline-none placeholder:opacity-40 min-w-0"
          style={{ color: textColor }}
        />
      </div>
    </div>
  );
}
