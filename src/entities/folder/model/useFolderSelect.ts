import { useFoldersStore } from '@/entities/folder/model/store.ts'
import { computed, onBeforeMount, ref } from 'vue'
import type { Nullable } from '@/shared/model/types.ts'
import type { Folder } from '@/entities/folder'
import { useRoute, useRouter } from 'vue-router'

export function useFolderSelect() {

  const router = useRouter()
  const route = useRoute()

  const folderStore = useFoldersStore()

  const routeFolderId = computed((): string => route?.params?.id as string || '')

  const activeFolder = ref<Nullable<Folder>>(null)
  const folders = computed(() => folderStore.getFolders)

  const setFolder = (folder: Folder): void => {
    activeFolder.value = folder
  }

  const goToFolder = async (): Promise<void> => {
    if (!activeFolder.value) return
    await router.push({
      name: 'folder',
      params: {
        id: activeFolder.value.$id,
        name: activeFolder.value.name,
      },
    })
  }

  onBeforeMount(async () => {
    await folderStore.getAll()
    if (!routeFolderId.value) return
    const actualFolder = folderStore.getFolder(routeFolderId.value)
    if (!actualFolder) return
    setFolder(actualFolder)
  })



  return {
    setFolder,
    goToFolder,
    folders,
    activeFolder,
  }

}
