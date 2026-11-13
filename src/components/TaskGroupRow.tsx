import { Fragment, useState, type ReactNode } from 'react'
import type { TaskGroup, WorkItem } from '@/types'
import { useApp } from '@/context/AppContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ChevronDown, ChevronRight } from 'lucide-react'

export function TaskGroupRow({ group, items, visibleCount, columnCount, children }: {
  group: TaskGroup, items: WorkItem[], visibleCount: number, columnCount: number, children: ReactNode
}) {
  const { renameTaskGroup, ungroupTasks } = useApp()
  const key = `cheapzdo-group-${group.id}`
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(key) === 'open' } catch { return false }
  })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const done = items.filter(item => item.state === 'Done').length
  return <Fragment>
    <tr className="bg-secondary/60 border-b border-border">
      <td colSpan={columnCount} className="px-3 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" variant="ghost" aria-expanded={expanded} onClick={() => {
            setExpanded(!expanded)
            try { localStorage.setItem(key, expanded ? 'closed' : 'open') } catch { /* Storage may be unavailable */ }
          }}>
            {expanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
            {group.name}
          </Button>
          <span className="text-xs text-muted-foreground">{items.length} tasks{visibleCount !== items.length ? ` (${visibleCount} match)` : ''}</span>
          <progress aria-label={`${group.name} progress`} value={done} max={items.length} className="w-20 h-2" />
          <span className="text-xs text-muted-foreground">{done}/{items.length} done</span>
          {editing ? <form className="flex gap-2" onSubmit={e => {
            e.preventDefault()
            if (!name.trim()) return
            renameTaskGroup(group.id, name)
            setEditing(false)
          }}>
            <Input aria-label="Rename group" value={name} maxLength={100} onChange={e => setName(e.target.value)} className="h-8 w-40" autoFocus />
            <Button size="sm" type="submit">Save</Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button>
          </form> : <Button size="sm" variant="ghost" onClick={() => {
            setName(group.name)
            setEditing(true)
          }}>Rename</Button>}
          <Button size="sm" variant="ghost" onClick={() => ungroupTasks(group.id)}>Ungroup</Button>
        </div>
      </td>
    </tr>
    {expanded && children}
  </Fragment>
}
