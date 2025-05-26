import { IpcMainInvokeEvent, BrowserWindow } from 'electron'

export const windowHandlers = {
  'window:isFocused': async (event: IpcMainInvokeEvent) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isFocused() ?? false
  }
} as const
