import { BaseFormater } from "../parser/base-formater";
import { ScadSyntaxTokenType } from "./scad_lexer";
import { //
    ScadExpressionArithmetic, ScadExpressionArray,  //
    ScadFunctionDefinition, ScadIfInstruction, ScadInstructionAssignment, //
    ScadInstructionCall, ScadModuleDefinition, //
    ScadInstructionCallChilded, ScadInstructionCallEnvironmented, ScadDefinitionLet, ScadForInstruction
} from "./scad_types";
import { getCorrectedLine } from "../parser/base-parser";



export class ScadFormater extends BaseFormater<ScadSyntaxTokenType>{


    constructor() {
        super();
    }

    protected stringifyToken(type: ScadSyntaxTokenType, value: string): string {
        if (type === 'LINE_COMMENT') {
            return value.substr(0, value.length - 1);
        }
        return super.stringifyToken(type, value);
    }

    process() {
        this.processLines();
        this.processMargin();
        this.processIndent();
        //this.assignmentFields();
    }


    // ==== LINES ====

    processLines() {
        this.walkTokens((token, walker) => {
            if (walker.lastToken) {
                let lineDist = getCorrectedLine(token) - getCorrectedLine(walker.lastToken);
                if (lineDist > 2) {
                    walker.moveLine(-(lineDist - 2));
                }
            }
        });

        this.walkItems((item, token, walker) => {
            if (item instanceof ScadDefinitionLet) {
                this.breakEnvirentmentedTokens(item, walker, () => [item.let_start, item.let_end, item.COMMA]);
            }
            if (item instanceof ScadExpressionArray) {
                this.breakEnvirentmentedTokens(item, walker, () => [item.start, item.end, item.COMMA]);
            }
            if (item instanceof ScadFunctionDefinition) {
                this.breakEnvirentmentedTokens(item, walker, () => [item.param_start, item.param_end, item.COMMA]);
            }
            if (item instanceof ScadModuleDefinition) {
                this.breakEnvirentmentedTokens(item, walker, () => [item.param_start, item.param_end, item.COMMA]);
            }
            if (item instanceof ScadIfInstruction) {
                this.foreachTokenItemPairsByName(item, [item.ENV_START, item.ENV_END], (from, to) => {
                    this.breakEnvirentmentedNodes(item, walker, () => [from, to, item.INST]);
                });
            }

        });


        // // Break Lists
        // this.forAllItemsInTree(item => {
        //     // Instuctions
        //     if (item instanceof ScadFunctionDefinition) {
        //         if (item.param_start.token && item.param_end.token && item.param_start.token.pos[0] !== item.param_end.token.pos[0]) {
        //             this.editLinesBreakAfter(item.param_end.token);
        //             this.editLinesBreakBefore(item.param_end.token);
        //         }
        //     }

    }

    processMargin() {
        this.walkTokens((token, walker) => {
            if (token.type === 'BRACE') {
                if (['{'].includes(token.value) && walker.nextToken && walker.nextToken.type !== 'BRACE') {
                    this.setMarginRight(token, 1);
                }
                if (['}'].includes(token.value) && walker.lastToken && walker.lastToken.type !== 'BRACE') {
                    this.setMarginLeft(token, 1);
                }
            }
            if (token.type === 'IDENTIFIER' && ['function', 'module'].includes(token.value)) {
                this.setMarginRight(token, 1);
            }

            if (token.type === 'SYMBOL' && [','].includes(token.value)) {
                this.setMarginRight(token, 1);
            }
            if (token.type === 'SYMBOL' && ['='].includes(token.value)) {
                this.setMarginLeft(token, 1);
                this.setMarginRight(token, 1);
            }
        });
        this.walkItems((item, token, walker) => {
            if (item instanceof ScadExpressionArithmetic) {
                this.foreachTokensByName(item, ScadExpressionArithmetic.op, token => {
                    this.setMarginLeft(token, 1);
                    this.setMarginRight(token, 1);
                });
            }
        });
    }




    processIndent() {
        this.walkIndent((item, token, walker) => {
            if (item instanceof ScadModuleDefinition) {
                this.addIndentBetween(item, walker, () => [item.param_start, item.param_end], 2);
                this.addIndentBetween(item, walker, () => [item.env_start, item.env_end], 2);
            }
            if (item instanceof ScadFunctionDefinition) {
                this.addIndentAfter(item, walker, () => [item.equals], 4);
            }

            if (item instanceof ScadInstructionAssignment) {
                this.addIndentAfter(item, walker, () => [item.equals], 4);
            }
            if (item instanceof ScadInstructionCall) {
                this.addIndentBetween(item, walker, () => [item.arg_start, item.arg_end], 2);
            }

            if (item instanceof ScadForInstruction) {
                this.addIndentBetween(item, walker, () => [item.arg_start, item.arg_end], 2);
                this.addIndentBetween(item, walker, () => [item.env_start, item.env_end], 2);
            }

            if (item instanceof ScadInstructionCallEnvironmented) {
                this.addIndentBetween(item, walker, () => [item.env_start, item.env_end], 2);
            }
            if (item instanceof ScadInstructionCallChilded) {
                if (!item.isChild) {
                    this.addIndent(walker, item.child, 2);
                }
            }

            if (item instanceof ScadDefinitionLet) {
                this.addIndentBetween(item, walker, () => [item.let_start, item.let_end], 2);
            }
            if (item instanceof ScadExpressionArray) {
                this.addIndentBetween(item, walker, () => [item.start, item.end], 2);
            }
            if (item instanceof ScadFunctionDefinition) {
                this.addIndentBetween(item, walker, () => [item.param_start, item.param_end], 2);
            }
            if (item instanceof ScadModuleDefinition) {
                this.addIndentBetween(item, walker, () => [item.param_start, item.param_end], 2);
            }

            if (item instanceof ScadIfInstruction) {
                this.foreachTokenItemPairsByName(item, [item.CONDITION_START, item.CONDITION_END], (from, to) => {
                    this.addIndentBetween(item, walker, () => [from, to], 2);
                });
                this.foreachTokenItemPairsByName(item, [item.ENV_START, item.ENV_END], (from, to) => {
                    this.addIndentBetween(item, walker, () => [from, to], 2);
                });
            }

        });

        //     if (item instanceof ScadIfInstruction) {
        //         this.foreachChildsByName(item, new ScadIfInstruction().ENV_START, env_start => {
        //             this.nextChildByName(<ScadIfInstruction>item, env_start, new ScadIfInstruction().ENV_END, env_end => {
        //                 this.childsFromTo(<ScadIfInstruction>item, env_start, env_end, child => {
        //                     this.indentItem(child, indent + 2);
        //                 });
        //             });
        //         });
        //     }



    }


    // assignmentFields() {
    //     let lastLine = -1;
    //     let field: ScadInstructionAssignment[] = [];
    //     let closeField = () => {
    //         let maxCol = 0;
    //         field.forEach(item => { if (item.equals.token) { maxCol = Math.max(maxCol, this.getCol(item.equals.token)); } });
    //         field.forEach(item => { if (item.equals.token) { this.shiftLeft(item.equals.token, maxCol - this.getCol(item.equals.token)); } });
    //         field = [];
    //     };
    //     this.forAllItemsInTree(item => {
    //         if (item instanceof ScadInstructionAssignment && item.equals.token) {
    //             if (field.length && this.getLine(item.equals.token) !== lastLine + 1) {
    //                 closeField();
    //             }
    //             field.push(item);
    //             lastLine = this.getLine(item.equals.token);
    //         }
    //     });
    //     if (field.length) { closeField(); }
    // }



}

