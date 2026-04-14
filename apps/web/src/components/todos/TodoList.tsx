'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Category { id: string; name: string; color: string }
interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
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
      setNewTitle(''); setNewCategoryId(null); setAdding(false); setShowCatPicker(false);
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

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">할일 목록</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> 추가
        </button>
      </div>

      <div className="px-5 py-3 space-y-1">
        {/* Add form */}
        {adding && (
          <div className="mb-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
            {/* Category */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowCatPicker((v) => !v); setCreatingCat(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300 transition-colors"
              >
                {selectedCat ? (
                  <>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: selectedCat.color }} />
                    <span className="flex-1 text-left text-sm">{selectedCat.name}</span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-sm text-gray-400">카테고리 없음</span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {showCatPicker && (
                <div className="absolute top-full left-0 mt-1 z-30 w-full bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
                  <button onClick={() => { setNewCategoryId(null); setShowCatPicker(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50">
                    없음
                  </button>
                  {categories.map((cat) => (
                    <button key={cat.id}
                      onClick={() => { setNewCategoryId(cat.id); setShowCatPicker(false); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                  {!creatingCat ? (
                    <button onClick={() => setCreatingCat(true)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 border-t border-gray-100">
                      <Plus className="h-3.5 w-3.5" /> 새 카테고리
                    </button>
                  ) : (
                    <div className="p-4 border-t border-gray-100 space-y-2.5">
                      <input autoFocus className="input-field text-sm py-2"
                        placeholder="카테고리 이름"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()} />
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button key={c} onClick={() => setNewCatColor(c)}
                            className={cn('h-5 w-5 rounded-full transition-all', newCatColor === c && 'ring-2 ring-offset-2 ring-gray-400 scale-110')}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleCreateCategory}
                          className="flex-1 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition-colors">
                          만들기
                        </button>
                        <button onClick={() => setCreatingCat(false)}
                          className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs">
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <input
              autoFocus={!showCatPicker}
              className="input-field"
              placeholder="할일을 입력하세요"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showCatPicker) handleAdd();
                if (e.key === 'Escape') { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }
              }}
            />
            <div className="flex gap-2">
              <button onClick={handleAdd}
                className="flex-1 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors">
                추가
              </button>
              <button onClick={() => { setAdding(false); setNewTitle(''); setNewCategoryId(null); setShowCatPicker(false); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                취소
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {todos.length === 0 && !adding && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">할일이 없습니다</p>
            <button onClick={() => setAdding(true)} className="mt-2 text-sm text-primary-500 hover:underline font-medium">
              추가하기
            </button>
          </div>
        )}

        {/* Pending */}
        {pending.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-2 px-1">완료 {completed.length}개</p>
            {completed.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: { todo: Todo; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className={cn('group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50 transition-colors', todo.isCompleted && 'opacity-50')}>
      <button
        onClick={() => onToggle(todo.id)}
        className={cn(
          'h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
          todo.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-300 hover:border-primary-400'
        )}
      >
        {todo.isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm text-gray-800 leading-tight', todo.isCompleted && 'line-through text-gray-400')}>
          {todo.title}
        </p>
        {todo.category && (
          <span className="inline-block text-[11px] px-1.5 py-0.5 rounded-full mt-1 font-medium"
            style={{ backgroundColor: todo.category.color + '18', color: todo.category.color }}>
            {todo.category.name}
          </span>
        )}
      </div>
      <button onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
