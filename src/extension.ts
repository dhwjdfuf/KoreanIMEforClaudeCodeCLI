import * as vscode from 'vscode';

class KoreanImeViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'koreanIme.inputView';
	private _view?: vscode.WebviewView;
	private _lastTerminal?: vscode.Terminal;
	private _disposables: vscode.Disposable[] = [];

	constructor(private readonly _extensionUri: vscode.Uri) {
		this._lastTerminal = vscode.window.activeTerminal;
		this._disposables.push(
			vscode.window.onDidChangeActiveTerminal((t) => {
				if (t) { this._lastTerminal = t; }
			})
		);
	}

	public dispose() {
		this._disposables.forEach(d => d.dispose());
	}

	private _refocusPanel() {
		const refocus = async () => {
			await vscode.commands.executeCommand('korean-ime-panel.focus');
		};
		for (const ms of [50, 200, 500]) {
			setTimeout(refocus, ms);
		}
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
		};

		webviewView.webview.html = this._getHtml();

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'send') {
				const terminal = this._lastTerminal || vscode.window.activeTerminal;
				if (terminal) {
					const config = vscode.workspace.getConfiguration('koreanIme');
					const sendNewline = config.get<boolean>('sendNewline', true);
					terminal.sendText(message.text, sendNewline);
					this._refocusPanel();
				} else {
					vscode.window.showWarningMessage('활성화된 터미널이 없습니다.');
				}
			} else if (message.type === 'shiftTab') {
				await vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: '\x1b[Z' });
				this._refocusPanel();
			} else if (message.type === 'escape') {
				await vscode.commands.executeCommand('workbench.action.terminal.sendSequence', { text: '\x1b' });
				this._refocusPanel();
			}
		});
	}

	public async focusInput() {
		await vscode.commands.executeCommand('koreanIme.inputView.focus');
		await vscode.commands.executeCommand('korean-ime-panel.focus');
		if (this._view) {
			this._view.webview.postMessage({ type: 'focus' });
		}
	}

	private _getHtml(): string {
		return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.input-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 0;
		border: 1px solid var(--vscode-input-border, #444);
		border-radius: 8px;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.input-wrapper:focus-within {
		border-color: var(--vscode-focusBorder, #007fd4);
		box-shadow: 0 0 0 1px var(--vscode-focusBorder, #007fd4);
	}
	.prompt {
		padding: 8px 0 8px 12px;
		font-size: var(--vscode-terminal-font-size, var(--vscode-editor-font-size, 13px));
		line-height: 1.5;
		color: var(--vscode-terminal-foreground, #e0e0e0);
		font-family: var(--vscode-terminal-font-family, var(--vscode-editor-font-family, monospace));
		user-select: none;
		flex-shrink: 0;
	}
	#input {
		width: 100%;
		min-height: 36px;
		max-height: 120px;
		padding: 8px 12px 8px 6px;
		font-size: var(--vscode-terminal-font-size, var(--vscode-editor-font-size, 13px));
		line-height: 1.5;
		color: var(--vscode-terminal-foreground, #e0e0e0);
		border: none;
		border-radius: 0 8px 8px 0;
		outline: none;
		background: transparent;
		font-family: var(--vscode-terminal-font-family, var(--vscode-editor-font-family, monospace));
		resize: none;
		overflow-y: auto;
	}
	#input:focus {
		border-color: none;
		box-shadow: none;
	}
	.hint {
		font-size: 11px;
		color: var(--vscode-descriptionForeground, #666);
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
	}
	.hint-left, .hint-right {
		display: flex;
		gap: 8px;
	}
	.hint kbd {
		background: var(--vscode-keybindingLabel-background, #333);
		border: 1px solid var(--vscode-keybindingLabel-border, #555);
		border-radius: 3px;
		padding: 0 4px;
		font-size: 10px;
		font-family: inherit;
		color: var(--vscode-keybindingLabel-foreground, #999);
	}
</style>
</head>
<body>
	<div class="input-wrapper">
		<span class="prompt">&gt;</span>
		<textarea id="input" rows="1" autocomplete="off" spellcheck="false"></textarea>
	</div>
	<div class="hint">
		<div class="hint-left">
			<span><kbd>Enter</kbd> 전송</span>
			<span><kbd>Shift+Enter</kbd> 줄바꿈</span>
		</div>
		<div class="hint-right">
			<span><kbd>Shift+Tab</kbd> 모드 전환</span>
		</div>
	</div>
	<script>
		const vscode = acquireVsCodeApi();
		const input = document.getElementById('input');

		let focusInterval = null;

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
				e.preventDefault();
				const text = input.value;
				if (text) {
					vscode.postMessage({ type: 'send', text: text });
					input.value = '';
					input.style.height = 'auto';
					if (focusInterval) clearInterval(focusInterval);
					focusInterval = setInterval(() => input.focus(), 30);
					setTimeout(() => {
						clearInterval(focusInterval);
						focusInterval = null;
					}, 1000);
				}
			}
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault();
				vscode.postMessage({ type: 'shiftTab' });
			}
			if (e.key === 'Escape' && !e.isComposing) {
				e.preventDefault();
				vscode.postMessage({ type: 'escape' });
			}
		});

		input.addEventListener('input', () => {
			input.style.height = 'auto';
			input.style.height = Math.min(input.scrollHeight, 120) + 'px';
		});

		window.addEventListener('message', (e) => {
			if (e.data.type === 'focus') {
				input.focus();
			}
		});

		input.focus();

		// force background to match terminal panel (#252526 in Visual Studio Dark)
		let applying = false;
		function forceBg() {
			if (applying) return;
			applying = true;
			const s = getComputedStyle(document.documentElement);
			const bg = s.getPropertyValue('--vscode-terminal-background').trim()
				|| s.getPropertyValue('--vscode-menu-background').trim()
				|| '#252526';
			[document.documentElement, document.body, input].forEach(el => {
				el.style.setProperty('background', bg, 'important');
				el.style.setProperty('background-color', bg, 'important');
			});
			applying = false;
		}
		forceBg();
		requestAnimationFrame(forceBg);
		new MutationObserver(forceBg).observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
		new MutationObserver(forceBg).observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
		new MutationObserver(forceBg).observe(document.head, { childList: true });
	</script>
</body>
</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new KoreanImeViewProvider(context.extensionUri);

	context.subscriptions.push(provider);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(KoreanImeViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('koreanIme.focusInput', () => {
			provider.focusInput();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('koreanIme.focusTerminal', () => {
			vscode.commands.executeCommand('workbench.action.terminal.focus');
		})
	);
}

export function deactivate() {}
