'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Category { id: string; name: string; color: string }
interface Todo {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  completedAt?: string;
  category?: Category;
}
interface Props { todos: Todo[]; onRefetch: () => void; date: string }

const PRESET_COLORS = ['#7c6ff7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export function TodoList({ todos, onRefetch, date }: Props) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['todo-categories'],
    queryFn: () => api.get('/todo-categories').then((r) => r.data).catch(() => []),
  });

  const selectedCat = categories.find((c) => c.id === newCategoryId);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await api.post('/todo-categories', { name: newCatName.trim(), color: newCatColor });
      qc.invalidateQueries({ queryKey: ['todo-categories'] });
      setCreatingCat(false);
      setNewCatName('');
    } catch {}
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await api.post('/todos', {
        title: newTitle.trim(),
        dueDate: date,
        ...(newCategoryId ? { categoryId: newCategoryId } : {}),
      });
      setNewTitle('');
      setNewCategoryId(null);
      setAdding(false);
      setShowCatPicker(false);
      onRefetch();
    } catch {}
  };

  const handleToggle = async (id: string) => {
    try { await api.patch(`/todos/${id}/complete`); onRefetch(); } catch {}
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/todos/${id}`); onRefetch(); } catch {}
  };

  const pending = todos.filter((t) => !t.isCompleted);
  const completed = todos.filter((t) => t.isCompleted);
  const allDone = todos.length > 0 && completed.length === todos.length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">오늘의 할일</h2>
          {todos.length > 0 && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
              allDone ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500')}>
              {completed.length}/{todos.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setAdding(true)} className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
          {/* Step 1: Category selector (TOP) */}
          <div className="relative">
            <label className="text-xs text-gray-500 block mb-1">카테고리</label>
            <button
              type="button"
              onClick={() => { setShowCatPicker((v) => !v); setCreatingCat(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300 transition-colors"
            >
              {selectedCat ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedCat.color }} />
                  <span className="flex-1 text-left">{selectedCat.name}</span>
                </>
              ) : (
                <span className="flex-1 text-left text-gray-400">카테고리 없음</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showCatPicker && (
              <div className="absolute top-full left-0 mt-1 z-30 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {/* Existing categories */}
                <button onClick={() => { setNewCategoryId(null); setShowCatPicker(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">
                  없음
                </button>
                {categories.map((cat) => (
                  <button key={cat.id}
                    onClick={() => { setNewCategoryId(cat.id); setShowCatPicker(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
                {/* Create new */}
                {!creatingCat ? (
                  <button onClick={() => setCreatingCat(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 border-t border-gray-100">
                    <Plus className="h-3.5 w-3.5" /> 새 카테고리 만들기
                  </button>
                ) : (
                  <div className="p-3 border-t border-gray-100 space-y-2">
                    <input
                      autoFocus
                      className="input-field text-sm py-1.5"
                      placeholder="카테고리 이름"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} onClick={() => setNewCatColor(c)}
                          className={cn('h-5 w-5 rounded-full transition-transform', newCatColor === c && 'ring-2 ring-offset-1 ring-gray-400 scale-110')}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateCategory}
                        className="flex-1 py-1 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600">
                        만들기
                      </button>
                      <button onClick={() => setCreatingCat(false)}
                        className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs">
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Title input (BOTTOM) */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">할일</label>
            <input
              autoFocus={!showCatPicker}
              className="input-field bg-white"
              placeholder="할일을 입력하세요"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showCatPicker) handleAdd();
                if (e.key === 'Escape') { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }
              }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} className="flex-1">추가</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* Pending todos */}
      <div className="space-y-1">
        {pending.length === 0 && !adding && (
          <div className="py-8 text-center text-sm text-gray-400">
            <p>할일이 없습니다</p>
            <button onClick={() => setAdding(true)} className="mt-2 text-primary-500 hover:underline text-xs">추가하기</button>
          </div>
        )}
        {pending.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-gray-400">완료 ({completed.length})</p>
            {allDone && <span className="text-xs text-green-500 font-medium">전부 완료!</span>}
          </div>
          <div className="space-y-1">
            {completed.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className={cn('group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 transition-colors', todo.isCompleted && 'opacity-60')}>
      <button
        onClick={() => onToggle(todo.id)}
        className={cn('h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
          todo.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400')}
      >
        {todo.isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-gray-800', todo.isCompleted && 'line-through text-gray-400')}>{todo.title}</p>
        {todo.category && (
          <span className="inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: todo.category.color + '20', color: todo.category.color }}>
            {todo.category.name}
          </span>
        )}
      </div>
      <button onClick={() => onDelete(todo.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
