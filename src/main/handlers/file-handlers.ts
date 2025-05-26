import { IpcMainInvokeEvent } from 'electron'
import { handleFileOpen } from '../../preload/file'
import fs from 'fs'
import { log } from '../../common/logger'
import { store } from '../../preload/store'

export const fileHandlers = {
  'open-file': async (_event: IpcMainInvokeEvent) => {
    return handleFileOpen({
      title: 'openFile...',
      properties: ['openFile']
    })
  },

  'open-directory': async (_event: IpcMainInvokeEvent) => {
    const path = await handleFileOpen({
      title: 'Select Directory',
      properties: ['openDirectory', 'createDirectory'],
      message: 'Select a directory for your project',
      buttonLabel: 'Select Directory'
    })

    // If path was selected and it differs from the current project path,
    // update the project path in store
    if (path) {
      if (path !== store.get('projectPath')) {
        store.set('projectPath', path)
        log.info('Project path changed', { newPath: path })
      }
    }

    return path
  },

  'get-local-image': async (_event: IpcMainInvokeEvent, path: string) => {
    try {
      const data = await fs.promises.readFile(path)
      const ext = path.split('.').pop()?.toLowerCase() || 'png'
      const base64 = data.toString('base64')
      return `data:image/${ext};base64,${base64}`
    } catch (error) {
      log.error('Failed to read image', {
        path,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
} as const
