// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const vscode_css_languageservice = require("vscode-css-languageservice");
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Vue-less-redefined" is now active!');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	//let disposable = vscode.commands.registerCommand('vscode-plugin-redefinedcss.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from vscode-plugin-redefinedcss!');
	//});
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['vue'], {
        provideDefinition
    }));
}
//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
/**
 * 查找文件定义的provider，匹配到了就return一个location，否则不做处理
 * 最终效果是，当按住Ctrl键时，如果return了一个location，字符串就会变成一个可以点击的链接，否则无任何效果
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 */

function checkSelection(text,selectorWord){
	const htmlScanner = vscode_html_languageservice_1.getLanguageService().createScanner(text);
	let attribute = null;
	let selector = {};
	let tokenType = htmlScanner.scan();
    while (tokenType !== vscode_html_languageservice_1.TokenType.EOS) {
        switch (tokenType) {
            case vscode_html_languageservice_1.TokenType.StartTag:
                attribute = null;
                if (selectorWord === htmlScanner.getTokenText())
					selector = { attribute: null, value: selectorWord };
                break;
            case vscode_html_languageservice_1.TokenType.AttributeName:
				attribute = htmlScanner.getTokenText().toLowerCase();
				// Convert the attribute to a standard class attribute
                if (attribute === 'classname') {
					attribute = 'class';
                }
                break;
            case vscode_html_languageservice_1.TokenType.AttributeValue:
                if (attribute === 'class' || attribute === 'id') {
                    if (htmlScanner.getTokenText().slice(1, -1).split(' ').indexOf(selectorWord) > -1) {
                       selector = { attribute, value: selectorWord};
                    }
                }
                break;
        }
		tokenType = htmlScanner.scan();
	}
	return selector;
}
function provideDefinition(document, position, token) {
	const fileName = document.fileName;
	const word = document.getText(document.getWordRangeAtPosition(position));
	const line = document.lineAt(position);
	const text = document.getText();
	const offset = document.offsetAt(position);
    let start = offset;
    let end = offset;
    while (start > 0 && text.charAt(start - 1) !== ' ' && text.charAt(start - 1) !== '\'' && text.charAt(start - 1) !== '"' && text.charAt(start - 1) !== '\n' && text.charAt(start - 1) !== '<')
        start -= 1;
    while (end < text.length && text.charAt(end) !== ' ' && text.charAt(end) !== '\'' && text.charAt(end) !== '"' && text.charAt(end) !== '\n' && text.charAt(end) !== '>')
        end += 1;
    var selectorWord = text.slice(start, end);
	// console.log('当前文件完整路径fileName: ' + fileName); // 当前文件完整路径
	// console.log('当前光标所在单词word: ' + word); // 当前光标所在单词
	// console.log('当前光标所在行line: ' + line.text); // 当前光标所在行
	// console.log('selectorWord',start,end,offset,selectorWord);
	let stylesheet = vscode_css_languageservice.getLESSLanguageService().parseStylesheet(document);
	let symbols = vscode_css_languageservice.getLESSLanguageService().findDocumentSymbols(document,stylesheet);
	let selector = checkSelection(text,selectorWord);
	var reg = new RegExp("\\."+selectorWord+"\\b");
	const foundSymbols = [];
	symbols.forEach((symbol) => {
		if (symbol.name.indexOf("&") !== -1) {
			// TODO: Handle nesting
		}
		if (symbol.name.search(reg) !== -1) {		
			foundSymbols.push(symbol.location)
		}
	});	
	
	if((/\.vue$/).test(fileName)) {
		if (selector.attribute === 'class' || selector.attribute === 'id'){
			if(foundSymbols && foundSymbols.length){
				let numline = foundSymbols[0].range.start.line;	
				return new vscode.Location(vscode.Uri.file(fileName), new vscode.Position(numline, 0));
			}else if(text.search(reg) !== -1){
				//解决style样式第一个无法识别的问题,直接全局搜索
				let wordPos = document.positionAt(text.indexOf('.'+selectorWord));
				let numline = document.lineAt(wordPos);			
				return new vscode.Location(vscode.Uri.file(fileName), new vscode.Position(numline.lineNumber, 0));
			}	
		}else{
			return new vscode.Location(vscode.Uri.file(fileName), new vscode.Position(0, 0));
		}
	}
}
module.exports = {
	activate,
	deactivate
}
