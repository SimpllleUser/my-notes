import type { Component } from 'vue'

let iconsPromise: Promise<Record<string, Component>> | null = null

export function loadLucideIcons() {
  iconsPromise ??= import('@lucide/vue').then((module) => module.icons)
  return iconsPromise
}

export async function resolveLucideIcon(name: string | undefined, fallback = 'Folder') {
  const icons = await loadLucideIcons()
  return (name && icons[name]) || icons[fallback]!
}
