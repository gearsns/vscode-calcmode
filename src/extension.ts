// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as mathjs from 'mathjs';

export function activate(context: vscode.ExtensionContext) {
	const math = mathjs.create(mathjs.all);
	const parser = math.parser();
	const orgHelp = math.help;
	const parserClear = () => {
		parser.clear();
		return "Clear";
	};
	math.import({
		clear: parserClear,
		help: (arg: any) => {
			if (arg === parserClear) {
				return {
					toString() {
						return "\nName: clear\n\nDescription:\n    clear defined functions and variables";
					}
				};
			}
			return orgHelp(arg);
		}
	}, { override: true });
	const calcLine = (editor: vscode.TextEditor, document: vscode.TextDocument, range: vscode.Range) => {
		const text = document.getText(new vscode.Range(new vscode.Position(range.start.line, 0), new vscode.Position(range.end.line, range.end.character)));
		if (text.length > 0 && text.match(/^[^=]/)) {
			editor.edit(e => {
				try {
					const ret = math.format(parser.evaluate(text));
					e.insert(new vscode.Position(range.end.line + 1, 0), `= ${ret}\n`);
				} catch (error) {
					e.insert(new vscode.Position(range.end.line + 1, 0), `= ${error}\n`);
				}
			});
		}
	};
	context.subscriptions.push(vscode.commands.registerCommand('calcmode.calcLine', () => {
		const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
		if (editor) {
			const range = editor.document.lineAt(editor.selection.end.line).range;
			editor.selection = new vscode.Selection(range.end, range.end);
			editor.edit(e => {
				e.insert(new vscode.Position(range.end.line, range.end.character), `\n`);
			});
		}
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.languageId === "calcmode") {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor && event.document === activeEditor.document) {
				if (event.contentChanges.length === 1 && event.contentChanges[0].text.match(/\n/)) {
					calcLine(activeEditor, event.document, event.contentChanges[0].range);
				}
			}
		}
	}, null, context.subscriptions));
	context.subscriptions.push(vscode.languages.registerHoverProvider(['calcmode'], {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			const range = document.getWordRangeAtPosition(position);
			const word: string = document.getText(range);
			try {
				{/* @ts-ignore */ }
				const mess: string = math.help(word);
				const documentation = new vscode.MarkdownString(`**${word}**\n\n----\n\n`)
					.appendCodeblock(mess.toString(), "calcmode");
				return Promise.resolve(new vscode.Hover(documentation));
			} catch (error) {
				return Promise.resolve(null);
			}
		}
	}));
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
		['calcmode'],
		{
			async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				const funcList = "clear|help|derivative|lsolve|lsolveAll|lup|lusolve|qr|rationalize|simplify|slu|usolve|usolveAll|abs|add|cbrt|ceil|cube|divide|dotDivide|dotMultiply|dotPow|exp|expm1|fix|floor|gcd|hypot|lcm|log|log10|log1p|log2|mod|multiply|norm|nthRoot|nthRoots|pow|round|sign|sqrt|square|subtract|unaryMinus|unaryPlus|xgcd|bitAnd|bitNot|bitOr|bitXor|leftShift|rightArithShift|rightLogShift|bellNumbers|catalan|composition|stirlingS2|arg|conj|im|re|distance|intersect|and|not|or|xor|apply|column|concat|count|cross|ctranspose|det|diag|diff|dot|eigs|expm|filter|flatten|forEach|getMatrixDataType|identity|inv|kron|map|matrixFromColumns|matrixFromFunction|matrixFromRows|ones|partitionSelect|range|reshape|resize|rotate|rotationMatrix|row|size|sort|sqrtm|squeeze|subset|trace|transpose|zeros|combinations|combinationsWithRep|factorial|gamma|kldivergence|multinomial|permutations|pickRandom|random|randomInt|compare|compareNatural|compareText|deepEqual|equal|equalText|larger|largerEq|smaller|smallerEq|unequal|setCartesian|setDifference|setDistinct|setIntersect|setIsSubset|setMultiplicity|setPowerset|setSize|setSymDifference|setUnion|erf|mad|max|mean|median|min|mode|prod|quantileSeq|std|sum|variance|bin|format|hex|oct|print|acos|acosh|acot|acoth|acsc|acsch|asec|asech|asin|asinh|atan|atan2|atanh|cos|cosh|cot|coth|csc|csch|sec|sech|sin|sinh|tan|tanh|to|clone|hasNumericValue|isInteger|isNaN|isNegative|isNumeric|isPositive|isPrime|isZero|numeric|typeOf|to|clone|hasNumericValue|isInteger|isNaN|isNegative|isNumeric|isPositive|isPrime|isZero|numeric|typeOf";
				let completionItems: vscode.CompletionItem[] = [];
				for (const name of funcList.split("|")) {
					completionItems.push(new vscode.CompletionItem(name));
				}
				return completionItems;
			}
		}
	));
}

// this method is called when your extension is deactivated
export function deactivate() { }
