'use client'

import { useSyncExternalStore } from 'react'

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

let listeners: Array<() => void> = []
let currentSnapshot = Date.now()

function subscribe(listener: () => void) {
  listeners.push(listener)
  const interval = setInterval(() => {
    currentSnapshot = Date.now()
    listeners.forEach((l) => l())
  }, 60000)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
    if (listeners.length === 0) {
      clearInterval(interval)
    }
  }
}

function getSnapshot(): number {
  return currentSnapshot
}

function getServerSnapshot(): number {
  return 0
}

export function TimeAgo({ date }: { date: string | Date }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const parsedDate = new Date(date)
  const isServer = now === 0
  const text = isServer ? '...' : getTimeAgo(parsedDate)

  return <span>{text}</span>
}
