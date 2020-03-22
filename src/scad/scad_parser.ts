import { ScadSyntaxTokenType, ARITHMETICAL, MODIFIERS } from "./scad_lexer";
import {
    ScadTreeItem, ScadComment, ScadUse, ScadInstruction, ScadInstructionEmpty, ScadInstructionAssignment,//
    ScadExpression, ScadInstructionCall, ScadExpressionArithmetic, ScadExpressionSigned, // 
    ScadExpressionVariable, ScadExpressionCall, ScadExpressionArray, ScadExpressionString, // 
    ScadModuleDefinition, ScadDefinitionParameter, ScadExpressionArrayaccess, ScadExpressionBraced, // 
    ScadExpressionSelection, ScadIfInstruction, ScadFunctionDefinition, ScadForInstruction,//
    ScadExpressionArrayGeneration, ScadExpressionLet, //
    ScadExpressionKordaccess, ScadInstructionCallSimple, ScadInstructionCallChilded, //
    ScadInstructionCallEnvironmented, ScadExpressionArrayGenerationFor, ScadDefinitionLet, //
    ScadDefinitionIf, ScadDefinitionForSeq, ScadDefinitionForIcn, ScadExpressionArrayGenerationForChild, // 
   
} from "./scad_types";
import { BaseParserFactory } from "../parser/base-parser";



export class ScadSyntaxParserFactory extends BaseParserFactory<ScadSyntaxTokenType>{

    constructor() {
        super();

        this.addRule('comment', () => new ScadComment(), (rule, result) => {
            if (!rule.expectToken(['LINE_COMMENT', 'BLOCK_COMMENT'], null, (t) => { result.value.set(t); })) { return false; }
            return [result, rule.index];
        }).asMain();

        this.addRule('use', () => new ScadUse(), (rule, result) => {
            if (
                !rule.expectToken('IDENTIFIER', 'use', (t) => { result.begin.set(t); }) &&
                !rule.expectToken('IDENTIFIER', 'include', (t) => { result.begin.set(t); })
            ) { return false; }
            if (!rule.expectToken('USE', null, (t) => { result.file.set(t); })) { return false; }
            return [result, rule.index];
        }).asMain();

        // === INSTRUCION ====

        this.addRule('[instruction]', () => <ScadTreeItem>{}, (rule, subject) => {
            if (rule.expectRule('instruction:empty', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:if', (c) => { subject = c; }, [false])) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:for', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:module', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:function', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:assignment', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:call', (c) => { subject = c; })) { return [subject, rule.index]; }
            rule.error('expected:[instruction]');
            return false;
        }).asMain();


        this.addRule('[environmented_instruction]', () => <ScadTreeItem>{}, (rule, subject) => {
            if (rule.expectRule('instruction:empty', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:if', (c) => { subject = c; }, [false])) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:for', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:assignment', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('instruction:call', (c) => { subject = c; })) { return [subject, rule.index]; }
            rule.error('expected:[environmented_instruction]');
            return false;
        });




        this.addRule('instruction:empty', () => new ScadInstructionEmpty(), (rule, subject) => {
            if (!rule.expectToken('SYMBOL', ';', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('instruction:assignment', () => new ScadInstructionAssignment(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
            if (!rule.expectToken('SYMBOL', '=', (t) => { subject.equals.set(t); })) { return false; }
            // activateError()
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            if (!rule.expectToken('SYMBOL', ';', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('instruction:call', () => new ScadInstructionCall(), (rule, subject) => {
            if (!rule.expectToken('SYMBOL', MODIFIERS, (t) => { subject.identifier.set(t); })) { /** optional **/ }
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }

            if (!rule.expectToken('BRACE', '(', (t) => { subject.arg_start.set(t); })) { return false; }
            rule.activateError();
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param]', (c) => { subject.addNamedNode(subject.ARG, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.arg_end.set(t); })) { return false; }

            // Simple
            if (rule.testToken('SYMBOL', ';')) {
                let result = Object.assign(new ScadInstructionCallSimple(), subject);
                if (!rule.expectToken('SYMBOL', ';', (t) => { result.end.set(t); })) { return false; }
                return [result, rule.index];
            }
            // Child
            if (rule.testToken('IDENTIFIER', null)) {
                let result = Object.assign(new ScadInstructionCallChilded(), subject);
                if (!rule.expectRule('instruction:call', (c) => { result.child.set(c); })) { return false; }
                if (result.child.node instanceof ScadInstructionCall) { (<ScadInstructionCall>result.child.node).isChild = true; }
                return [result, rule.index];
            }
            // Environment
            if (rule.testToken('BRACE', '{')) {
                let result = Object.assign(new ScadInstructionCallEnvironmented(), subject);
                if (!rule.expectToken('BRACE', '{', (t) => { result.env_start.set(t); })) { return false; }
                while (!rule.testToken('BRACE', '}')) {
                    if (!rule.expectRule('[environmented_instruction]', (c) => { result.addNamedNode(result.ENV, c); })) { return false; }
                }
                if (!rule.expectToken('BRACE', '}', (t) => { result.env_end.set(t); })) { return false; }
                return [result, rule.index];
            }
            rule.error("not a valid situation for call");
            return false;
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        // --- IF Instruction ---

        this.addRule('instruction:if', () => new ScadIfInstruction(), (rule, subject) => {
            let [extFuntion] = rule.getArgs(1);

            if (!rule.expectToken('IDENTIFIER', 'if', (t) => { subject.ifmark.set(t); })) { return false; }
            rule.activateError();

            let getCondition = () => {
                if (!rule.expectToken('BRACE', '(', (t) => { subject.addNamedToken(subject.CONDITION_START, t); })) { return false; }
                if (!rule.expectRule('[expression]', (c) => { subject.addNamedNode(subject.CONDITION, c); })) { return false; }
                if (!rule.expectToken('BRACE', ')', (t) => { subject.addNamedToken(subject.CONDITION_END, t); })) { return false; }
            };
            let getScope = () => {
                if (rule.testToken('BRACE', '{')) {
                    if (!rule.expectToken('BRACE', '{', (t) => { subject.addNamedToken(subject.ENV_START, t); })) { return false; }
                    while (!rule.testToken('BRACE', '}')) {
                        if (extFuntion) {
                            if (!rule.expectRule('[extended:function:instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                        } else {
                            if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                        }
                    }
                    if (!rule.expectToken('BRACE', '}', (t) => { subject.addNamedToken(subject.ENV_END, t); })) { return false; }
                } else {
                    if (extFuntion) {
                        if (!rule.expectRule('[extended:function:instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                    } else {
                        if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                    }
                }
            };

            if (getCondition()) { return false; }
            if (getScope()) { return false; }

            while (rule.testTokens([['IDENTIFIER', 'else'], ['IDENTIFIER', 'if']])) {
                if (!rule.expectToken('IDENTIFIER', 'else', (t) => { subject.addNamedToken(subject.ELSE_IF_ELSE, t); })) { return false; }
                if (!rule.expectToken('IDENTIFIER', 'if', (t) => { subject.addNamedToken(subject.ELSE_IF_IF, t); })) { return false; }
                if (getCondition()) { return false; }
                if (getScope()) { return false; }
            }

            if (rule.testToken('IDENTIFIER', 'else')) {
                if (!rule.expectToken('IDENTIFIER', 'else', (t) => { subject.elsemark.set(t); })) { return false; }
                if (getScope()) { return false; }
            }

            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('instruction:for', () => new ScadForInstruction(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'for', (t) => { subject.formark.set(t); })) { return false; }
            rule.activateError();
            if (!rule.expectToken('BRACE', '(', (t) => { subject.arg_start.set(t); })) { return false; }
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:loopParam]', (c) => { subject.addNamedNode(subject.PARAM, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.arg_end.set(t); })) { return false; }
            if (rule.testToken('BRACE', '{')) {
                if (!rule.expectToken('BRACE', '{', (t) => { subject.env_start.set(t); })) { return false; }
                while (!rule.testToken('BRACE', '}')) {
                    if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                }
                if (!rule.expectToken('BRACE', '}', (t) => { subject.env_end.set(t); })) { return false; }
            } else {
                if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
            }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        // === MODULE DEFINITION ====

        this.addRule('instruction:module', () => new ScadModuleDefinition(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'module', (t) => { subject.start.set(t); })) { return false; }
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }

            if (!rule.expectToken('BRACE', '(', (t) => { subject.param_start.set(t); })) { return false; }
            rule.activateError();
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param_def]', (c) => { subject.addNamedNode(subject.PARAM, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.param_end.set(t); })) { return false; }

            if (rule.testToken('BRACE', '{')) {
                if (!rule.expectToken('BRACE', '{', (t) => { subject.env_start.set(t); })) { return false; }
                while (!rule.testToken('BRACE', '}')) {
                    if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
                }
                if (!rule.expectToken('BRACE', '}', (t) => { subject.env_end.set(t); })) { return false; }
            } else {
                if (!rule.expectRule('[instruction]', (c) => { subject.addNamedNode(subject.INST, c); })) { return false; }
            }

            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        // === FUNCTION DEFINITION ====

        this.addRule('instruction:function', () => new ScadFunctionDefinition(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'function', (t) => { subject.start.set(t); })) { return false; }
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
            rule.activateError();
            if (!rule.expectToken('BRACE', '(', (t) => { subject.param_start.set(t); })) { return false; }
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param_def]', (c) => { subject.addNamedNode(subject.PARAM, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.param_end.set(t); })) { return false; }

             // Normal function                
             if (!rule.expectToken('SYMBOL', '=', (t) => { subject.equals.set(t); })) { return false; }
             if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
             if (!rule.expectToken('SYMBOL', ';', (t) => { subject.end.set(t); })) { return false; }

            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        
        

        // === EXPRESSIONS ====

        this.addRule('[expression]', () => <ScadExpression>{}, (rule, subject) => {
            let argResult: ScadExpression | null = null;
            if (!rule.expectRule('[single_expression]', (c) => { argResult = c; })) { return false; }
            if (!argResult) {
                return false;
            }
            let comments: [string, ScadSyntaxTokenType][] = [];
            comments.push(['comment', 'LINE_COMMENT']);
            comments.push(['comment', 'BLOCK_COMMENT']);
            if (!rule.testToken('SYMBOL', ARITHMETICAL, comments)) {
                return [argResult, rule.index];
            }
            let arithmeticResult = new ScadExpressionArithmetic();
            arithmeticResult.addNamedNode(arithmeticResult.ARG, argResult);
            while (rule.testToken('SYMBOL', ARITHMETICAL, comments)) {
                if (!rule.expectToken('SYMBOL', ARITHMETICAL, (t) => { arithmeticResult.addNamedToken(arithmeticResult.OP, t); }, comments)) { return false; }
                if (!rule.expectRule('[single_expression]', (c) => { argResult = c; })) { return false; }
                arithmeticResult.addNamedNode(arithmeticResult.ARG, argResult);
            }
            if (!arithmeticResult) {
                return false;
            }
            return [arithmeticResult, rule.index];
        });


        this.addRule('[single_expression]', () => <ScadExpression>{}, (rule, subject) => {
            let result: [ScadExpression, number] | null = null;
            if (!result && rule.expectRule('expression:number', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:string', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:signed', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:let', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:array_gen', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:array:for', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:array', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:braced', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:var', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result && rule.expectRule('expression:call', (c) => { subject = c; })) { result = [subject, rule.index]; }
            if (!result) {
                return false;
            }
            rule.index = result[1];

            let findExtension = true;
            while (findExtension) {
                findExtension = false;
                if (rule.testToken('BRACE', '[')) {
                    let extendedResult = new ScadExpressionArrayaccess();
                    extendedResult.base.set(subject);
                    if (!rule.expectToken('BRACE', '[', (t) => { extendedResult.start.set(t); })) { return false; }
                    if (!rule.expectRule('[expression]', (c) => { extendedResult.index.set(c); })) { return false; }
                    if (!rule.expectToken('BRACE', ']', (t) => { extendedResult.end.set(t); })) { return false; }
                    findExtension = true;
                    subject = extendedResult;
                    if (!extendedResult) { return false; }
                }
                if (rule.testToken('SYMBOL', '.')) {
                    let extendedResult = new ScadExpressionKordaccess();
                    extendedResult.base.set(subject);
                    if (!rule.expectToken('SYMBOL', '.', (t) => { extendedResult.dot.set(t); })) { return false; }
                    if (!rule.expectToken('IDENTIFIER', ['x', 'y', 'z'], (t) => { extendedResult.kord.set(t); })) { return false; }
                    findExtension = true;
                    subject = extendedResult;
                    if (!extendedResult) { return false; }
                }
                if (rule.testToken('SYMBOL', '?')) {
                    let extendedResult = new ScadExpressionSelection();
                    extendedResult.condition.set(subject);
                    if (!rule.expectToken('SYMBOL', '?', (t) => { extendedResult.ifmark.set(t); })) { return false; }
                    if (!rule.expectRule('[expression]', (c) => { extendedResult.value1.set(c); })) { return false; }
                    if (!rule.expectToken('SYMBOL', ':', (t) => { extendedResult.elsemark.set(t); })) { return false; }
                    if (!rule.expectRule('[expression]', (c) => { extendedResult.value2.set(c); })) { return false; }
                    findExtension = true;
                    subject = extendedResult;
                    if (!extendedResult) { return false; }
                }
            }

            return [subject, rule.index];
        }).asMain();


        // ATOMIC EXPRESSION

        this.addRule('expression:number', () => new ScadExpressionVariable(), (rule, subject) => {
            if (!rule.expectToken('NUMBER', null, (t) => { subject.var.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('expression:string', () => new ScadExpressionString(), (rule, subject) => {
            if (!rule.expectToken('STRING', null, (t) => { subject.value.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('expression:signed', () => new ScadExpressionSigned(), (rule, subject) => {
            if (!rule.expectToken('SYMBOL', ['+', '-', '!'], (t) => { subject.sign.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            if (subject.value instanceof ScadExpressionSigned) {
                return false;
            }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('expression:let', () => new ScadExpressionLet(), (rule, subject) => {
            if (!rule.testToken('IDENTIFIER', 'let')) { return false; }
            rule.activateError();
            if (!rule.expectRule('[definition:let]', (c) => { subject.let.set(c); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('expression:array_gen', () => new ScadExpressionArrayGeneration(), (rule, subject) => {
            if (!rule.expectToken('BRACE', '[', (t) => { subject.begin.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.value1.set(c); })) { return false; }
            if (!rule.expectToken('SYMBOL', ':', (t) => { subject.sep1.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.value2.set(c); })) { return false; }
            if (rule.testToken('SYMBOL', ':')) {
                if (!rule.expectToken('SYMBOL', ':', (t) => { subject.sep2.set(t); })) { return false; }
                if (!rule.expectRule('[expression]', (c) => { subject.value3.set(c); })) { return false; }
            }
            if (!rule.expectToken('BRACE', ']', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('expression:array', () => new ScadExpressionArray(), (rule, subject) => {
            if (!rule.expectToken('BRACE', '[', (t) => { subject.start.set(t); })) { return false; }
            let elementsDone = rule.testToken('BRACE', ']');
            while (!elementsDone) {
                if (!rule.expectRule('[expression]', (c) => { subject.addNamedNode(subject.ARG, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                    // "Komma Am Ende" Tollerant
                    if (rule.testToken('BRACE', ']')) {
                        elementsDone = true;
                    }
                } else {
                    elementsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ']', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('expression:array:for', () => new ScadExpressionArrayGenerationFor(), (rule, subject) => {
            if (!rule.expectToken('BRACE', '[', (t) => { subject.begin.set(t); })) { return false; }
            if (!rule.expectRule('expression:array:for...child', (c) => { subject.value.set(c); })) { return false; }
            if (!rule.expectToken('BRACE', ']', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('expression:array:for...child', () => new ScadExpressionArrayGenerationForChild(), (rule, subject) => {
            if (!rule.expectRule('[definition:for]', (c) => { subject.forDefinition.set(c); })) { return false; }
            let prefixDone = false;
            while (!prefixDone) {
                prefixDone = true;
                if (rule.testToken('IDENTIFIER', 'let')) {
                    rule.expectRule('[definition:let]', (c) => { subject.addNamedNode(subject.LET_PREFIX, c); });
                    prefixDone = false;
                }
                if (rule.testToken('IDENTIFIER', 'if')) {
                    rule.expectRule('[definition:if]', (c) => { subject.addNamedNode(subject.IF_PREFIX, c); });
                    prefixDone = false;
                }
            }
            if (rule.testToken('IDENTIFIER', 'for')) {
                rule.expectRule('expression:array:for...child', (c) => { subject.value.set(c); });
            } else {
                if (rule.testToken('IDENTIFIER', 'each')) {
                    if (!rule.expectToken('IDENTIFIER', 'each', (t) => { subject.eachToken.set(t); })) { return false; }
                    if (!rule.expectRule('expression:array', (c) => { subject.value.set(c); })) { return false; }
                } else {
                    if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
                }
            }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);




        this.addRule('expression:braced', () => new ScadExpressionBraced(), (rule, subject) => {
            if (!rule.expectToken('BRACE', '(', (t) => { subject.open.set(t); })) { return false; }
            rule.activateError();
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.close.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('expression:var', () => new ScadExpressionVariable(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.var.set(t); })) { return false; }
            if (rule.testToken('BRACE', '(')) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('expression:call', () => new ScadExpressionCall(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
            if (!rule.expectToken('BRACE', '(', (t) => { subject.start.set(t); })) { return false; }
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param]', (c) => { subject.addNamedNode(subject.PARAM, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        // === PARAMETER ====

        this.addRule('[definition:param]', () => new ScadDefinitionParameter(), (rule, subject) => {
            if (rule.testTokens([['IDENTIFIER', null], ['SYMBOL', '=']])) {
                if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
                if (!rule.expectToken('SYMBOL', '=', (t) => { subject.equals.set(t); })) { return false; }
            }
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('[definition:param_def]', () => new ScadDefinitionParameter(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
            if (rule.testToken('SYMBOL', '=')) {
                if (!rule.expectToken('SYMBOL', '=', (t) => { subject.equals.set(t); })) { return false; }
                if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('[definition:if]', () => new ScadDefinitionIf(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'if', (t) => { subject.ifmarker.set(t); })) { return false; }
            rule.activateError();
            if (!rule.expectToken('BRACE', '(', (t) => { subject.if_start.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.condition.set(c); })) { return false; }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.if_end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('[definition:let]', () => new ScadDefinitionLet(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'let', (t) => { subject.letmarker.set(t); })) { return false; }
            rule.activateError();
            if (!rule.expectToken('BRACE', '(', (t) => { subject.let_start.set(t); })) { return false; }
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                let ste: ScadDefinitionParameter | null = null;
                if (!rule.expectRule('[definition:param]', (c) => { ste = <ScadDefinitionParameter>c; })) { return false; }
                ste = (<ScadDefinitionParameter>(<any>ste));
                if (!ste.identifier.token) { return false; }
                subject.addNamedNode(subject.PARAM, ste);
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.let_end.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('[definition:for]', () => <ScadTreeItem>{}, (rule, subject) => {
            if (rule.expectRule('[definition:for_sequence]', (c) => { subject = c; })) { return [subject, rule.index]; }
            if (rule.expectRule('[definition:for_icn]', (c) => { subject = c; })) { return [subject, rule.index]; }
            return false;
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('[definition:for_sequence]', () => new ScadDefinitionForSeq(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'for', (t) => { subject.formark.set(t); })) { return false; }
            if (!rule.expectToken('BRACE', '(', (t) => { subject.begin_param.set(t); })) { return false; }
            let paramsDone = rule.testToken('BRACE', ')');
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param]', (c) => { subject.addNamedNode(subject.PARAMETER, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('BRACE', ')', (t) => { subject.end_param.set(t); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);

        this.addRule('[definition:for_icn]', () => new ScadDefinitionForIcn(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', 'for', (t) => { subject.formark.set(t); })) { return false; }
            if (!rule.expectToken('BRACE', '(', (t) => { subject.begin_param.set(t); })) { return false; }
            let paramsDone = false;
            while (!paramsDone) {
                if (!rule.expectRule('[definition:param]', (c) => { subject.addNamedNode(subject.PARAMETER, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    paramsDone = true;
                }
            }
            if (!rule.expectToken('SYMBOL', ';', (t) => { subject.sep1.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.condition.set(c); })) { return false; }
            if (!rule.expectToken('SYMBOL', ';', (t) => { subject.sep2.set(t); })) { return false; }
            let nextDone = false;
            while (!nextDone) {
                if (!rule.expectRule('instruction:assignment', (c) => { subject.addNamedNode(subject.NEXT, c); })) { return false; }
                if (rule.testToken('SYMBOL', ',')) {
                    if (!rule.expectToken('SYMBOL', ',', (t) => { subject.addNamedToken(subject.COMMA, t); })) { return false; }
                } else {
                    nextDone = true;
                }
            }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);


        this.addRule('[definition:loopParam]', () => new ScadDefinitionParameter(), (rule, subject) => {
            if (!rule.expectToken('IDENTIFIER', null, (t) => { subject.identifier.set(t); })) { return false; }
            if (!rule.expectToken('SYMBOL', '=', (t) => { subject.equals.set(t); })) { return false; }
            if (!rule.expectRule('[expression]', (c) => { subject.value.set(c); })) { return false; }
            return [subject, rule.index];
        }).acceptComments(ScadComment.COMMENT, ['LINE_COMMENT', 'BLOCK_COMMENT']);
    }




}
