import * as path from 'path'
import * as vscode from 'vscode'
import {promises as fs} from 'fs'
import {loadConfig} from './config/findConfig'
import {executeGroq} from './query'
import {GroqContentProvider} from './content-provider'

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.executeGroq', async () => {
    const activeFile = vscode.window.activeTextEditor?.document.fileName || ''
    const activeDir = path.dirname(activeFile)
    const config = await loadConfig(activeDir)
    if (!config) {
      vscode.window.showErrorMessage('Could not resolve sanity.json configuration file')
      return
    }
    vscode.window.showInformationMessage(
      `Using projectId "${config.projectId}" and dataset "${config.dataset}"`
    )
    const file = await fs.readFile(activeFile, 'utf8')
    const result = await executeGroq(config.projectId, config.dataset, file)
    const panel = vscode.window.createWebviewPanel(
      'executionResultsWebView',
      'GROQ Execution Result',
      vscode.ViewColumn.Two,
      {}
    )
    const contentProvider = new GroqContentProvider(result)
    const registration = vscode.workspace.registerTextDocumentContentProvider(
      'groq',
      contentProvider
    )
    context.subscriptions.push(registration)

    const html = await contentProvider.getCurrentHTML()
    panel.webview.html = html
    // openInUntitled(JSON.stringify(result, null, 2), 'json')
  })

  context.subscriptions.push(disposable)
}

// async function openInUntitled(content: string, language?: string) {
//   const document = await vscode.workspace.openTextDocument({
//     language,
//     content,
//   })
//   vscode.window.showTextDocument(document)
// }
