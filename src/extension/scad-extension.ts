import * as vscode from 'vscode';
import { ScadLexer } from '../scad/scad_lexer';
import { ScadSyntaxParserFactory } from '../scad/scad_parser';
import { ScadFormater } from '../scad/scad_formater';
import { ScadSyntaxTree } from '../scad/scad_types';

export class ScadExtension {


    public checkErrors(code: string, callback: (from: vscode.Position, to: vscode.Position, error: string) => void) {
        let lexer = new ScadLexer(code);
        let parser = new ScadSyntaxParserFactory();

        try {
            let tokens = lexer.parse();
            parser.perform(tokens);
        } catch (e) {
            if (e.token) {
                let positionFrom = new vscode.Position(e.token.pos[0], e.token.pos[0]);
                let positionTo = this.positionPlus(positionFrom, e.token.value.length);
                callback(positionFrom, positionTo, e.errormsg);
            } else if (e.position) {
                let positionFrom = this.getPosition(code.split('\n'), e.position);
                let positionTo = this.positionPlus(positionFrom, 1);
                callback(positionFrom, positionTo, e.message);
            }
        }
    }

    parse(code: string): ScadSyntaxTree {
        let lexer = new ScadLexer(code);
        let tokens = lexer.parse();
        let parser = new ScadSyntaxParserFactory();
        let tree = parser.perform(tokens);
        return tree;
    }

    format(tree: ScadSyntaxTree) {
        let formatetCode = new ScadFormater().format(tree);
        return formatetCode;
    }

    protected getPosition(lines: string[], index: number): vscode.Position {
        let line = 0;
        while (index >= lines[line].length) {
            index -= lines[line].length;
            index -= '\n'.length;
            line++;
            if (line >= lines.length) {
                return new vscode.Position(0, 0);
            }
            if (index < 0) {
                return new vscode.Position(0, 0);
            }
        }
        return new vscode.Position(line, index);
    }

    protected positionPlus(pos: vscode.Position, col: number): vscode.Position {
        return new vscode.Position(pos.line, pos.character + col);
    }

}