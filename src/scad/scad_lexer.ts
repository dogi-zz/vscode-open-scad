import { BaseLexer } from "../parser/base-lexer";

export const ARITHMETICAL = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!'];
export const MODIFIERS = ['%', '#', '!', '*'];

const BRACES = ['{', '}', '(', ')', '[', ']'];
const SYMBOLS = [',', '.', ';', ':', '=', '!', '?'].concat(ARITHMETICAL).sort((a, b) => b.length - a.length);

const VAR_MATCH = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

export type ScadSyntaxTokenType =
    'LINE_COMMENT' | 'BLOCK_COMMENT' |
    'STRING' | 'NUMBER' | 'IDENTIFIER' | 'USE' |
    'BRACE' | 'SYMBOL';


export class ScadLexer extends BaseLexer<ScadSyntaxTokenType> {

    prepareNextRuleTest() {
        while (this.hasChar() && this.char().match(/\s/)) {
            this.skip(1);
        }
    }

    initRules() {

        // line comment
        this.addRule(() => this.startsWith('//'), () => {
            let end = this.lenUntil('\n');
            return this.createToken('LINE_COMMENT', end, this.substring(end));
        });

        // block comment
        this.addRule(() => this.startsWith('/*'), () => {
            let end = this.lenUntil('*/', true);
            return this.createToken('BLOCK_COMMENT', end, this.substring(end));
        });

        // string
        this.addRule(() => this.startsWith('"'), () => {
            let end = this.findCharwiseUntil(1, 1, (char, done) => {
                if (char === '\\') { return 2; }
                if (char === '"') { done(); }
                return 1;
            }, true);
            return this.createToken('STRING', end);
        });

        // number
        this.addRule(() => this.startReg(/[0-9]/, 1) ? true : false, () => {
            let end = this.findUntil(string => {
                if (string.match(/^\d+\.?\d*$/)) { return true; }
                if (string.match(/^\.\d+$/)) { return true; }
                if (string.match(/^\d+\.?\d*e\-?\d*$/)) { return true; }
                return false;
            });
            return this.createToken('NUMBER', end);
        });

        // use
        let hadUseKeyword: () => boolean = () => {
            return this.tokens.length > 0
                && this.tokens[this.tokens.length - 1].type === 'IDENTIFIER'
                && this.tokens[this.tokens.length - 1].value === 'use' || this.tokens[this.tokens.length - 1].value === 'include';
        };
        this.addRule(() => this.startsWith('<') && hadUseKeyword(), () => {
            let end = this.lenUntil('>', true);
            return this.createToken('USE', end, this.substring(end));
        });

        // braces
        this.addRule(() => this.startsWithOneOf(BRACES) ? true : false, () => {
            let prefix = <string>this.startsWithOneOf(BRACES);
            return this.createToken('BRACE', prefix.length);
        });

        // symbols
        this.addRule(() => this.startsWithOneOf(SYMBOLS) ? true : false, () => {
            let prefix = <string>this.startsWithOneOf(SYMBOLS);
            return this.createToken('SYMBOL', prefix.length);
        });

        // identifier
        this.addRule(() => this.startReg(VAR_MATCH, 1) ? true : false, () => {
            let end = this.findUntil(string => {
                return string.match(VAR_MATCH) ? true : false;
            });
            return this.createToken('IDENTIFIER', end);
        });

    }


}
