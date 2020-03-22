import * as vscode from 'vscode';
import { ScadExtension } from './extension/scad-extension';
import { ScadSyntaxTree } from './scad/scad_types';

const fs = require('fs');

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "o-scad" is now active!');

	const scadExtension = new ScadExtension();
	const collection = vscode.languages.createDiagnosticCollection('scad');

	let documentMap: { [string: string]: string } = {};

	const checkFile = (uri: vscode.Uri, code: string) => {
		let start = new Date().getTime();
		scadExtension.checkErrors(code, (positionFrom, positionTo, text) => {
			collection.set(uri, [{
				code: '',
				message: text,
				range: new vscode.Range(positionFrom, positionTo),
				severity: vscode.DiagnosticSeverity.Error,
				source: '',
			}]);
		});
		return new Date().getTime() - start;
	};

	let activeCheckTimeout: any;
	let parseStatusDispose: vscode.Disposable | null = null;

	const checkActiveDocument = (document: vscode.TextDocument): void => {
		if (document) {
			let code = document.getText();
			if (activeCheckTimeout) {
				clearTimeout(activeCheckTimeout);
			} else {
				parseStatusDispose = vscode.window.setStatusBarMessage('SCAD parse ...');
			}
			activeCheckTimeout = setTimeout(() => {
				collection.delete(document.uri);
				activeCheckTimeout = null;
				let parseTime = checkFile(document.uri, code);
				if (parseStatusDispose) { parseStatusDispose.dispose(); }
				vscode.window.setStatusBarMessage('SCAD parse time: ' + parseTime + 'ms', 2000);
			}, 500);

		}
	};


	const checkWorkspace = () => {
		collection.clear();
		vscode.workspace.findFiles('**/*.scad').then(files => {
			if (!files || !files.length) { return; }
			let start = new Date().getTime();
			let promise = Promise.resolve();
			files.filter(uri => uri.scheme === 'file').forEach(uri => {
				promise = promise.then(() => {
					let code = (documentMap[uri.path]) ? documentMap[uri.path] : fs.readFileSync(uri.path, 'UTF-8');
					collection.delete(uri);
					checkFile(uri, code);
				});
			});
			promise = promise.then(() => {
				let time = new Date().getTime() - start;
				time = Math.ceil(time / 100) / 10;
				vscode.window.setStatusBarMessage('SCAD Check Workspace Time: ' + time + ' seconds', 5000);
			});
		});
	};
	setTimeout(() => {
		checkWorkspace();
	}, 10);


	let disposable = vscode.commands.registerCommand('extension.openscadCheckWorkspace', () => {
		checkWorkspace();
	});

	context.subscriptions.push(disposable);


	vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'scad' }, {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			let tokens: ScadSyntaxTree;
			let parseTime = 0;
			let formatTime = 0;
			try {
				let start = new Date().getTime();
				tokens = scadExtension.parse(document.getText());
				parseTime = new Date().getTime() - start;
			} catch (e) {
				console.error(e);
				vscode.window.showInformationMessage("Parse Error" + e);
				return [];
			}
			try {
				let start = new Date().getTime();
				let formatetCode = scadExtension.format(tokens);
				formatTime = new Date().getTime() - start;
				if (formatetCode === null) {
					vscode.window.showInformationMessage("error while format: empty result");
					return [];
				} else {
					let fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
					vscode.window.showInformationMessage('SCAD parse time: ' + parseTime + 'ms, format time: ' + formatTime + 'ms');
					return [
						vscode.TextEdit.replace(fullRange, formatetCode)
					];
				}
			} catch (e) {
				console.error(e);
				vscode.window.showInformationMessage("error while format:" + e);
				return [];
			}
		}
	});


	/** Register Code Action  */

	//vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'scad' }, {
	//	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken) {
	//		if (range.start.line !== range.end.line || range.start.character !== range.end.character) {
	//			console.info("updateDiagnostics on CodeActionsProvider" + document.uri.path);
	//		}
	//		return [];
	//	}
	//});

	/**  Check Document on every Cnage  */


	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		documentMap[event.document.uri.path] = event.document.getText();
		checkActiveDocument(event.document);
	}));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
		if (documentMap[document.uri.path]) {
			delete documentMap[document.uri.path];
		}
		console.info("onDidSaveTextDocument", document.uri.path);
	}));

	/** Check Document when Active Editor changes  */

	if (vscode.window.activeTextEditor) {
		console.info("check on Enter");
		checkActiveDocument(vscode.window.activeTextEditor.document);
	}
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		console.info('onDidChangeActiveTextEditor');
		if (editor) {
			checkActiveDocument(editor.document);
		}
	}));

	// TODO

	console.info(vscode.workspace.rootPath);
	console.info("HIER");



}


// this method is called when your extension is deactivated
export function deactivate() { }

