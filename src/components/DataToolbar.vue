<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  ChevronDown,
  Download,
  RefreshCw,
  Settings2,
  Trash2,
  Upload,
} from "@lucide/vue";
import type { SyncStatus } from "../composables/useLevels";

const props = defineProps<{
  lastSyncedAt: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
}>();

const emit = defineEmits<{
  export: [];
  import: [text: string];
  clearAll: [];
  refreshRanks: [];
}>();

const syncLabel = computed(() => {
  if (props.syncStatus === "syncing") return "Syncing…";
  if (props.syncStatus === "error")
    return `Sync failed — will retry next visit`;
  if (!props.lastSyncedAt) return "Never synced";
  return `Synced ${relativeTime(props.lastSyncedAt)}`;
});

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const fileInput = ref<HTMLInputElement | null>(null);
const root = ref<HTMLElement | null>(null);
const open = ref(false);

function toggleMenu(): void {
  open.value = !open.value;
}

function closeMenu(): void {
  open.value = false;
}

function onDocClick(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) closeMenu();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") closeMenu();
}

onMounted(() => {
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKeydown);
});

function onExportClick(): void {
  emit("export");
  closeMenu();
}

function triggerImport(): void {
  fileInput.value?.click();
  closeMenu();
}

function onFileChange(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => emit("import", String(reader.result));
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = "";
}

function onClearAll(): void {
  if (
    confirm(
      "Permanently delete all levels in your list? This cannot be undone.",
    )
  ) {
    emit("clearAll");
  }
  closeMenu();
}

function onRefreshClick(): void {
  emit("refreshRanks");
}
</script>

<template>
  <div class="options-wrapper" ref="root">
    <button class="btn" @click="toggleMenu" :aria-expanded="open">
      <Settings2 :size="15" />
      Options
      <ChevronDown :size="14" class="chevron" :class="{ open }" />
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json"
      class="hidden-input"
      @change="onFileChange"
    />
    <div v-if="open" class="menu glass-panel glass-strong">
      <button class="menu-item" @click="onExportClick">
        <Download :size="15" />
        Export JSON
      </button>
      <button class="menu-item" @click="triggerImport">
        <Upload :size="15" />
        Import JSON
      </button>
      <button class="menu-item menu-item-danger" @click="onClearAll">
        <Trash2 :size="15" />
        Clear all data
      </button>
      <div class="menu-divider"></div>
      <button
        class="menu-item"
        :disabled="syncStatus === 'syncing'"
        @click="onRefreshClick"
      >
        <RefreshCw :size="15" :class="{ spin: syncStatus === 'syncing' }" />
        Refresh ranks
      </button>
      <p class="sync-label mono" :class="{ error: syncStatus === 'error' }">
        {{ syncLabel }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.options-wrapper {
  position: relative;
}

.chevron {
  transition: transform 200ms var(--ease);
}

.chevron.open {
  transform: rotate(180deg);
}

.hidden-input {
  display: none;
}

.menu {
  position: absolute;
  top: calc(100% + 0.6rem);
  right: 0;
  width: 230px;
  /* Never wider than the screen on a 360px phone. */
  max-width: calc(100vw - 2rem);
  padding: 0.5rem;
  z-index: 100;
  background: linear-gradient(155deg, rgba(20, 14, 32, 0.52), rgba(20, 14, 32, 0.4));
  border: 1px solid var(--border-strong);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  animation: menu-in 160ms var(--ease);
}

@keyframes menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.85rem;
  text-align: left;
  transition: background 150ms var(--ease), color 150ms var(--ease);
}

.menu-item:hover:not(:disabled) {
  background: rgba(var(--glow-cyan), 0.12);
  color: var(--accent-cyan);
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item-danger:hover {
  background: rgba(var(--glow-danger), 0.12);
  color: #ffb3ba;
}

.menu-divider {
  height: 1px;
  margin: 0.4rem 0.2rem;
  background: var(--border);
}

.spin {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sync-label {
  margin: 0.3rem 0.2rem 0;
  padding: 0.3rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.sync-label.error {
  color: #ffb3ba;
}

@media (pointer: coarse) {
  .menu-item {
    min-height: 44px;
  }
}

/* Short landscape can't fit the whole menu below the button. */
@media (orientation: landscape) and (max-height: 500px) {
  .menu {
    max-height: calc(100dvh - 5rem);
    overflow-y: auto;
  }
}
</style>
