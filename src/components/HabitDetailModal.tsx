import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Habit } from '../data/db'
import { toDayKey, startOfDay } from '../utils/date'

interface HabitDetailModalProps {
  habit?: Habit
  isOpen: boolean
  onClose: () => void
  onIncrement: (habitId: string) => void
  onDecrement: (habitId: string) => void
  onUpdate?: (habitId: string, patch: { name?: string; description?: string }) => Promise<void> | void
  onDelete?: (habitId: string) => Promise<void> | void
}

export default function HabitDetailModal({ habit, isOpen, onClose, onIncrement, onDecrement, onUpdate, onDelete }: HabitDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'))
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', keyHandler)
    const t = setTimeout(() => { setVisible(true); dialogRef.current?.querySelector<HTMLElement>('button')?.focus() }, 0)
    return () => { document.removeEventListener('keydown', keyHandler); clearTimeout(t); document.body.style.overflow = prev; setVisible(false) }
  }, [isOpen, onClose])

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setNotes(habit.description ?? '')
    }
  }, [habit])

  const today = useMemo(() => startOfDay(new Date()), [])
  const dayKeyToday = toDayKey(today)

  const countsByDay = useMemo(() => {
    if (!habit) return new Map<string, number>()
    const map = new Map<string, number>()
    for (const d of habit.completedDates) {
      const k = toDayKey(d)
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    return map
  }, [habit])

  const todayCount = countsByDay.get(dayKeyToday) ?? 0

  const lastNDays = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = []
    const d = new Date(today)
    for (let i = 0; i < 14; i++) {
      const key = toDayKey(d)
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      days.push({ key, label, count: countsByDay.get(key) ?? 0 })
      d.setDate(d.getDate() - 1)
    }
    return days
  }, [countsByDay, today])

  if (!isOpen || !habit) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={dialogRef} className={`w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-lg transition transform duration-200 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-2xl" aria-hidden>{habit.icon || '🎯'}</div>
            {!editing ? (
              <h2 className="text-lg font-semibold">{habit.name}</h2>
            ) : (
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" aria-label="Habit name" />
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted">Today</div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary" aria-label="Decrement" onClick={() => onDecrement(habit.id)} disabled={todayCount <= 0}>−</button>
              <div className="min-w-10 text-center tabular-nums">{todayCount}</div>
              <button type="button" className="btn btn-primary" aria-label="Increment" onClick={() => onIncrement(habit.id)}>＋</button>
            </div>
          </div>

          <div className="mb-2 text-sm font-medium">Last 14 days</div>
          <div className="space-y-1 max-h-64 overflow-auto pr-1">
            {lastNDays.map(d => (
              <div key={d.key} className="flex items-center gap-3">
                <div className="w-20 text-sm text-muted">{d.label}</div>
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-[color:var(--color-muted)]" style={{ width: `${Math.min(100, d.count * 10)}%` }} aria-label={`${d.label} count ${d.count}`} />
                </div>
                <div className="w-10 text-right text-sm tabular-nums">{d.count}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium">Notes / Target</div>
            {!editing ? (
              <div className="text-sm text-muted min-h-10 whitespace-pre-wrap">{habit.description || '—'}</div>
            ) : (
              <textarea className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} aria-label="Notes or target" />
            )}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {!confirmDelete ? (
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(true)}>Delete</button>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={() => onDelete?.(habit.id)}>Confirm</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setName(habit.name); setNotes(habit.description ?? '') }}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={async () => { await onUpdate?.(habit.id, { name: name.trim() || habit.name, description: notes.trim() || undefined }); setEditing(false) }}>Save</button>
                </>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
