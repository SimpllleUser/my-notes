<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { OutputData } from '@bloklabs/core'
import { ColorPicker } from '@/features/color-picker'
import { IconPicker } from '@/features/icon-picker'
import { TextEditor } from '@/features/rich-text-editor'
import {
  UIInputField,
  UiButton,
  UiCard,
  UiDivider,
  UiDropdown,
  UiFileTree,
  UiIconButton,
  UiLoading,
  UiMenu,
  UiPicker,
  UiPopover,
  UiSearchInput,
  UiStatus,
  UiTabs,
} from '@/shared/ui'
import {
  ButtonColor,
  ButtonVariant,
  DividerColor,
  DividerDirection,
  DividerPlacement,
  DropdownLocation,
  FileTreeNodeType,
  FolderColor,
  InputType,
  LoadingColor,
  LoadingSize,
  LoadingVariant,
  MenuDirection,
  MenuSize,
  MenuVariant,
  PopoverLocation,
  StatusTone,
  TabsPlacement,
  TabsVariant,
} from '@/shared/model/enums.ts'
import type { FileTreeNode, UiTabItem } from '@/shared/ui'

const selectedView = ref('All notes')
const selectedMenuItem = ref('overview')
const selectedHorizontalMenuItem = ref('recent')
const activeWorkspaceTab = ref('overview')
const selectedTreeNode = ref('ui-popover')
const expandedTreeNodes = ref(['src', 'shared', 'ui'])
const selectedColor = ref<string | undefined>(FolderColor.Primary)
const selectedIcon = ref<string | undefined>('Star')
const editorVisible = ref(false)
const editorContent = shallowRef<OutputData>({
  blocks: [
    {
      type: 'paragraph',
      data: { text: 'Edit this paragraph to try the rich text editor.' },
    },
  ],
})
const fileTreeItems: FileTreeNode[] = [
  {
    id: 'src',
    label: 'src',
    type: FileTreeNodeType.Folder,
    children: [
      {
        id: 'features',
        label: 'features',
        type: FileTreeNodeType.Folder,
        children: [
          { id: 'color-picker', label: 'color-picker', type: FileTreeNodeType.Folder },
          { id: 'icon-picker', label: 'icon-picker', type: FileTreeNodeType.Folder },
        ],
      },
      {
        id: 'shared',
        label: 'shared',
        type: FileTreeNodeType.Folder,
        children: [
          {
            id: 'ui',
            label: 'ui',
            type: FileTreeNodeType.Folder,
            children: [
              { id: 'ui-button', label: 'UiButton.vue', type: FileTreeNodeType.File },
              { id: 'ui-popover', label: 'UiPopover.vue', type: FileTreeNodeType.File },
              { id: 'ui-file-tree', label: 'UiFileTree.vue', type: FileTreeNodeType.File },
            ],
          },
          { id: 'enums', label: 'enums.ts', type: FileTreeNodeType.File },
        ],
      },
    ],
  },
]
const workspaceTabs: UiTabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

function selectView(view: string, hide: () => void) {
  selectedView.value = view
  hide()
}

function updateEditorContent(content: OutputData) {
  editorContent.value = content
}

function toggleEditorVisibility(event: Event) {
  editorVisible.value = (event.target as HTMLDetailsElement).open
}
</script>

<template>
  <main class="space-y-10 p-6 md:p-8">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold">UI Kit</h1>
      <p class="text-base-content/70">
        Shared DaisyUI components and feature examples, grouped by use.
      </p>
    </header>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Controls</h2>
        <p class="text-base-content/70">Buttons, icon buttons, and status indicators.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <UiButton :color="ButtonColor.Primary">
          <template #prefix><span aria-hidden="true">＋</span></template>
          Create item
        </UiButton>
        <UiButton :variant="ButtonVariant.Outlined" :color="ButtonColor.Secondary">
          Outlined
          <template #suffix><span aria-hidden="true">→</span></template>
        </UiButton>
        <UiButton :variant="ButtonVariant.Ghost">Ghost</UiButton>
        <UiButton loading>Saving</UiButton>
        <UiIconButton label="Add item" :color="ButtonColor.Accent">
          <template #icon>＋</template>
        </UiIconButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiStatus label="Online" :tone="StatusTone.Success" />
        <UiStatus :tone="StatusTone.Warning">Needs attention</UiStatus>
        <UiStatus label="Offline" :tone="StatusTone.Neutral">
          <template #suffix><span class="badge badge-error badge-sm">3</span></template>
        </UiStatus>
      </div>
    </section>

    <section class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-semibold">Forms</h2>
          <p class="text-base-content/70">Labels, validation, prefix and suffix slots.</p>
        </div>
        <UIInputField label="Email" :type="InputType.Email" placeholder="you@example.com">
          <template #prefix><span aria-hidden="true">@</span></template>
          <template #helper>We’ll only use this for account updates.</template>
        </UIInputField>
        <UIInputField
          label="Required field"
          placeholder="Enter a value"
          invalid
          error-text="This field is required."
        />
        <UiSearchInput placeholder="Search notes...">
          <template #suffix><kbd class="kbd kbd-sm">⌘ K</kbd></template>
        </UiSearchInput>
      </div>

      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-semibold">Selection and overlays</h2>
          <p class="text-base-content/70">Popover menus and the reusable picker wrapper.</p>
        </div>
        <UiPopover
          :location="PopoverLocation.BottomStart"
          :open-on-hover="false"
          :open-on-click="true"
        >
          <template #activator="{ props }">
            <UiButton v-bind="props" :color="ButtonColor.Neutral">Open menu</UiButton>
          </template>
          <template #menu>
            <li><a>Profile</a></li>
            <li><a>Settings</a></li>
          </template>
        </UiPopover>
        <UiDropdown label="More actions" :location="DropdownLocation.BottomStart">
          <template #default="{ hide }">
            <li><button @click="selectView('Favorites', hide)">Add to favorites</button></li>
            <li><button @click="selectView('Archived', hide)">Archive</button></li>
          </template>
        </UiDropdown>
        <UiPicker>
          <template #trigger="{ toggle }">
            <UiButton :variant="ButtonVariant.Outlined" @click="toggle">
              {{ selectedView }}
            </UiButton>
          </template>
          <template #default="{ hide }">
            <ul class="menu w-52 p-0">
              <li><button @click="selectView('All notes', hide)">All notes</button></li>
              <li><button @click="selectView('Favorites', hide)">Favorites</button></li>
              <li><button @click="selectView('Archived', hide)">Archived</button></li>
            </ul>
          </template>
        </UiPicker>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Loading</h2>
        <p class="text-base-content/70">DaisyUI loading styles, sizes, colors, and labels.</p>
      </div>
      <div class="flex flex-wrap items-center gap-6">
        <UiLoading label="Spinner" />
        <UiLoading :variant="LoadingVariant.Dots" :size="LoadingSize.Large" label="Loading" />
        <UiLoading :variant="LoadingVariant.Ring" :color="LoadingColor.Primary" />
        <UiLoading :variant="LoadingVariant.Ball" :color="LoadingColor.Info" />
        <UiLoading :variant="LoadingVariant.Bars" :color="LoadingColor.Success" />
        <UiLoading :variant="LoadingVariant.Infinity" :color="LoadingColor.Accent" />
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Surfaces</h2>
        <p class="text-base-content/70">Compound cards with figure, title, and action slots.</p>
      </div>
      <UiCard class="max-w-lg" bordered>
        <template #figure>
          <div class="grid min-h-32 w-full place-items-center bg-primary/10">
            <span class="badge badge-primary">Featured</span>
          </div>
        </template>
        <template #title>Workspace</template>
        <template #title-extra><span class="badge badge-secondary">New</span></template>
        <p>A card provides the DaisyUI figure, body, title, and actions structure.</p>
        <template #actions>
          <UiButton :variant="ButtonVariant.Ghost">Cancel</UiButton>
          <UiButton :color="ButtonColor.Primary">Open</UiButton>
        </template>
      </UiCard>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Navigation</h2>
        <p class="text-base-content/70">A nested file tree with selected and expanded nodes.</p>
      </div>
      <div class="max-w-sm space-y-3">
        <UiFileTree
          v-model="selectedTreeNode"
          v-model:expanded="expandedTreeNodes"
          :items="fileTreeItems"
          label="Project files"
          bordered
        />
        <p class="text-sm text-base-content/70">Selected node: {{ selectedTreeNode }}</p>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Layout</h2>
        <p class="text-base-content/70">Dividers for stacked and side-by-side content.</p>
      </div>
      <div class="flex max-w-lg flex-col">
        <div class="card grid h-16 place-items-center bg-base-200">First section</div>
        <UiDivider :color="DividerColor.Primary" :placement="DividerPlacement.Start">
          OR
        </UiDivider>
        <div class="card grid h-16 place-items-center bg-base-200">Second section</div>
      </div>
      <div class="flex h-36 max-w-lg items-stretch">
        <div class="card grid grow place-items-center bg-base-200">Left</div>
        <UiDivider :direction="DividerDirection.Horizontal">OR</UiDivider>
        <div class="card grid grow place-items-center bg-base-200">Right</div>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Tabs</h2>
        <p class="text-base-content/70">Switch between named panel slots with keyboard support.</p>
      </div>
      <UiTabs
        v-model="activeWorkspaceTab"
        :tabs="workspaceTabs"
        :variant="TabsVariant.Lift"
        :placement="TabsPlacement.Top"
        label="Workspace sections"
      >
        <template #overview>
          <h3 class="text-lg font-semibold">Workspace overview</h3>
          <p class="mt-2 text-base-content/70">Summary content for the selected workspace.</p>
        </template>
        <template #activity>
          <h3 class="text-lg font-semibold">Recent activity</h3>
          <p class="mt-2 text-base-content/70">Recent changes and updates appear here.</p>
        </template>
        <template #settings>
          <h3 class="text-lg font-semibold">Workspace settings</h3>
          <p class="mt-2 text-base-content/70">Manage the workspace preferences.</p>
        </template>
      </UiTabs>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Menus</h2>
        <p class="text-base-content/70">Nested navigation, active and disabled items.</p>
      </div>
      <UiMenu
        v-model="selectedMenuItem"
        title="Project"
        :size="MenuSize.Small"
        :variant="MenuVariant.Bordered"
        class="max-w-xs"
      >
        <template #default="{ select, isActive }">
          <li>
            <button :class="{ 'menu-active': isActive('overview') }" @click="select('overview')">
              Overview
            </button>
          </li>
          <li>
            <details open>
              <summary>Features</summary>
              <ul>
                <li>
                  <button
                    :class="{ 'menu-active': isActive('color-picker') }"
                    @click="select('color-picker')"
                  >
                    Color picker
                  </button>
                </li>
                <li>
                  <button
                    :class="{ 'menu-active': isActive('icon-picker') }"
                    @click="select('icon-picker')"
                  >
                    Icon picker
                  </button>
                </li>
              </ul>
            </details>
          </li>
          <li class="menu-disabled"><button disabled>Coming soon</button></li>
        </template>
      </UiMenu>
      <UiMenu
        v-model="selectedHorizontalMenuItem"
        :direction="MenuDirection.Horizontal"
        :size="MenuSize.Small"
        :variant="MenuVariant.Box"
      >
        <template #default="{ select, isActive }">
          <li>
            <button :class="{ 'menu-active': isActive('recent') }" @click="select('recent')">
              Recent
            </button>
          </li>
          <li>
            <button :class="{ 'menu-active': isActive('starred') }" @click="select('starred')">
              Starred
            </button>
          </li>
          <li>
            <button :class="{ 'menu-active': isActive('archived') }" @click="select('archived')">
              Archived
            </button>
          </li>
        </template>
      </UiMenu>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-2xl font-semibold">Features</h2>
        <p class="text-base-content/70">Domain components built from the shared UI primitives.</p>
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <UiCard>
          <template #title>Color picker</template>
          <p>Choose a folder color. The trigger slot can use the selected value.</p>
          <ColorPicker v-model="selectedColor" label="Choose folder color">
            <template #trigger="{ toggle, value }">
              <UiButton :variant="ButtonVariant.Outlined" @click="toggle">
                <span class="size-4 rounded" :class="value ?? 'bg-base-200'" />
                Pick a color
              </UiButton>
            </template>
          </ColorPicker>
          <span class="badge badge-ghost">{{ selectedColor }}</span>
        </UiCard>

        <UiCard>
          <template #title>Icon picker</template>
          <p>Search Lucide icons and bind the selected icon name.</p>
          <IconPicker v-model="selectedIcon" label="Choose icon">
            <template #trigger="{ toggle, icon }">
              <UiButton :variant="ButtonVariant.Outlined" @click="toggle">
                <component :is="icon" v-if="icon" :size="18" />
                {{ selectedIcon ?? 'Choose an icon' }}
              </UiButton>
            </template>
          </IconPicker>
          <span class="badge badge-ghost">{{ selectedIcon }}</span>
        </UiCard>
      </div>

      <details
        class="collapse collapse-arrow border border-base-300 bg-base-100"
        @toggle="toggleEditorVisibility"
      >
        <summary class="collapse-title text-lg font-medium">Rich text editor</summary>
        <div class="collapse-content">
          <TextEditor v-if="editorVisible" :content="editorContent" @update="updateEditorContent" />
        </div>
      </details>
    </section>
  </main>
</template>
