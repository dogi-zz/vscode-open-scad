import { ScadFormater } from "./scad_formater";
import { ScadLexer } from "./scad_lexer";
import { ScadSyntaxParserFactory } from "./scad_parser";
import { ScadSyntaxTree } from "./scad_types";
import { BaseParserdebug } from "../parser/base-parser-debug";
const fs = require('fs');

console.info("=== START APPLICATION ===================");

let verbose = true;
let bounds: number[] = [];
let file = '../DOLIB/doGearConf.escad';
//bounds = [110, 126];

let printTokens = true;
let printTree = true;
let formatCode = false;

let code: string = fs.readFileSync(file, 'UTF-8');
if (bounds.length) { code = code.split('\n').slice(bounds[0], bounds[1]).join('\n'); }
let lexer = new ScadLexer(code);

let tokens = lexer.parse();
if (printTokens) {
    tokens.forEach(t => console.info(t));
}

let parser = new ScadSyntaxParserFactory();
if (verbose) { parser.debug = true; }
//parser.debugPos = 60;

let tree: ScadSyntaxTree | null = null;
let start = new Date().getTime();
try {
    tree = parser.perform(tokens);
} catch (e) {
    console.info("...");
    console.error(e);
    console.info("...");
    BaseParserdebug.exportErrorReport(parser.debugReport, code.split('\n'));
}
console.info("parse Time: " + (new Date().getTime() - start) + ' ms');
console.info('\n\n');

if (tree && printTree) {
    tree.print();
    BaseParserdebug.exportTreeReport(tree.getDebugReport(), code.split('\n'));
}

if (tree && formatCode) {
    start = new Date().getTime();
    let formatetCode = new ScadFormater().format(tree);

    console.info("CODE======");

    let formatetCodeLines = formatetCode.split('\n');
    formatetCodeLines.forEach((line, idx) => {
        let is = '' + (idx + 1);
        while (is.length < ('' + formatetCodeLines.length).length) { is = ' ' + is; }
        console.info(is + " " + line);
    });
    console.info("format Time: " + (new Date().getTime() - start) + ' ms');
}

console.info("=== END APPLICATION =====================");
