import { ScadSyntaxTokenType } from "./scad_lexer";
import { TreeItemToken, TreeItem, TreeItemNode, BaseSyntaxTree } from "../parser/base-tree";
import { BaseParserToken } from "../parser/base-parser";


export interface ScadSyntaxToken extends BaseParserToken<ScadSyntaxTokenType> { }

export abstract class ScadSyntaxTree extends BaseSyntaxTree<ScadSyntaxTokenType>{ }

export abstract class ScadTreeItem extends TreeItem<ScadSyntaxTokenType> { }
export class ScadTreeItemToken extends TreeItemToken<ScadSyntaxTokenType> { }
export class ScadTreeItemNode extends TreeItemNode<ScadSyntaxTokenType> { }







export class ScadComment extends ScadTreeItem {
    public static COMMENT = 'comment';

    value: ScadTreeItemToken = new ScadTreeItemToken(this, 'value');
    constructor() { super(); this.comment = true; }
}

export class ScadUse extends ScadTreeItem {
    begin: ScadTreeItemToken = new ScadTreeItemToken(this, 'begin');
    file: ScadTreeItemToken = new ScadTreeItemToken(this, 'file');
}


// ====================
// === INSTRUCTION ====
// ====================

export class ScadInstruction extends ScadTreeItem { }

export class ScadInstructionEmpty extends ScadInstruction {
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadInstructionAssignment extends ScadInstruction {
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    equals: ScadTreeItemToken = new ScadTreeItemToken(this, 'equals');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadInstructionCall extends ScadInstruction {
    public ARG = 'arg';
    public COMMA = 'comma';
    public isChild = false;
    modifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'modifier');
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    arg_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_start');
    arg_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_end');
}

export class ScadInstructionCallSimple extends ScadInstructionCall {
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}


export class ScadInstructionCallChilded extends ScadInstructionCall {
    child: ScadTreeItemNode = new ScadTreeItemNode(this, 'child');
}

export class ScadInstructionCallEnvironmented extends ScadInstructionCall {
    public ENV = 'env';
    env_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_start');
    env_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_end');
}



export class ScadIfInstruction extends ScadInstruction {
    public CONDITION_START = 'c_start';
    public CONDITION = 'condition';
    public CONDITION_END = 'c_end';
    public ELSE_IF_ELSE = 'elsifmark_else';
    public ELSE_IF_IF = 'elsifmark_if';
    public ELSE = 'elsifmark';
    public ENV_START = 'env_start';
    public ENV_END = 'env_end';
    public INST = 'instruction';
    ifmark: ScadTreeItemToken = new ScadTreeItemToken(this, 'ifmark');
    elsemark: ScadTreeItemToken = new ScadTreeItemToken(this, 'elsemark');
}

export class ScadForInstruction extends ScadInstruction {
    public INST = 'instruction';
    public SEPARATOR = 'separator';

    public PARAM = 'param';
    public COMMA = 'comma';

    formark: ScadTreeItemToken = new ScadTreeItemToken(this, 'formark');
    arg_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_start');
    arg_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'arg_end');
    env_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'env_start');
    env_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'env_end');
}



// ====================
// === MODULE =========
// ====================

export class ScadModuleDefinition extends ScadInstruction {
    public PARAM = 'param';
    public COMMA = 'comma';
    public INST = 'instruction';
    start: ScadTreeItemToken = new ScadTreeItemToken(this, 'start');
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    param_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'param_start');
    param_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'param_end');
    env_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'env_start');
    env_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'env_end');
}


// ====================
// === FUNCTION =======
// ====================

export class ScadFunctionDefinition extends ScadInstruction {
    
    /** ScadDefinitionParameter */
    public PARAM = 'param';
    public COMMA = 'comma';
    public LET = 'let';
    public LET_COMMA = 'let_comma';
    start: ScadTreeItemToken = new ScadTreeItemToken(this, 'start');
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    param_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'param_start');
    param_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'param_end');
    equals: ScadTreeItemToken = new ScadTreeItemToken(this, 'equals');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

// ====================
// === EXPRESSIONS ====
// ====================


export class ScadExpression extends ScadTreeItem { }


export class ScadExpressionNumber extends ScadExpression {
    value: ScadTreeItemToken = new ScadTreeItemToken(this, 'value');
}

export class ScadExpressionString extends ScadExpression {
    value: ScadTreeItemToken = new ScadTreeItemToken(this, 'value');
}

export class ScadExpressionVariable extends ScadExpression {
    var: ScadTreeItemToken = new ScadTreeItemToken(this, 'var');
}


export class ScadExpressionSigned extends ScadExpression {
    sign: ScadTreeItemToken = new ScadTreeItemToken(this, 'sign');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
}



export class ScadExpressionLet extends ScadExpression {
    let: ScadTreeItemNode = new ScadTreeItemNode(this, 'let');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
}


export class ScadExpressionBraced extends ScadExpression {
    open: ScadTreeItemToken = new ScadTreeItemToken(this, 'open');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
    close: ScadTreeItemToken = new ScadTreeItemToken(this, 'close');
}

export class ScadExpressionArithmetic extends ScadExpression {
    public static op = 'op';

    public ARG = 'arg';
    public OP = 'op';
}


export class ScadExpressionArray extends ScadExpression {
    public ARG = 'arg';
    public COMMA = 'comma';
    start: ScadTreeItemToken = new ScadTreeItemToken(this, 'start');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadExpressionCall extends ScadExpression {
    public PARAM = 'param';
    public COMMA = 'comma';
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    start: ScadTreeItemToken = new ScadTreeItemToken(this, 'start');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadExpressionArrayaccess extends ScadExpression {
    public IDX = 'idx';
    base: ScadTreeItemNode = new ScadTreeItemNode(this, 'base');
    start: ScadTreeItemToken = new ScadTreeItemToken(this, 'start');
    index: ScadTreeItemNode = new ScadTreeItemNode(this, 'index');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadExpressionKordaccess extends ScadExpression {
    public IDX = 'idx';
    public OPEN = 'open';
    public CLOSE = 'close';
    base: ScadTreeItemNode = new ScadTreeItemNode(this, 'base');
    dot: ScadTreeItemToken = new ScadTreeItemToken(this, 'dot');
    kord: ScadTreeItemToken = new ScadTreeItemToken(this, 'kord');
}

export class ScadExpressionSelection extends ScadExpression {
    open: ScadTreeItemToken = new ScadTreeItemToken(this, 'open');
    condition: ScadTreeItemNode = new ScadTreeItemNode(this, 'condition');
    close: ScadTreeItemToken = new ScadTreeItemToken(this, 'close');
    ifmark: ScadTreeItemToken = new ScadTreeItemToken(this, 'ifmark');
    value1: ScadTreeItemNode = new ScadTreeItemNode(this, 'value1');
    elsemark: ScadTreeItemToken = new ScadTreeItemToken(this, 'thenmark');
    value2: ScadTreeItemNode = new ScadTreeItemNode(this, 'value2');
}



export class ScadExpressionArrayGeneration extends ScadExpression {
    begin: ScadTreeItemToken = new ScadTreeItemToken(this, 'begin');
    value1: ScadTreeItemNode = new ScadTreeItemNode(this, 'value1');
    sep1: ScadTreeItemToken = new ScadTreeItemToken(this, 'sep1');
    value2: ScadTreeItemNode = new ScadTreeItemNode(this, 'value2');
    sep2: ScadTreeItemToken = new ScadTreeItemToken(this, 'sep2');
    value3: ScadTreeItemNode = new ScadTreeItemNode(this, 'value3');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}



export class ScadExpressionArrayGenerationFor extends ScadExpression {

    begin: ScadTreeItemToken = new ScadTreeItemToken(this, 'begin');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

export class ScadExpressionArrayGenerationForChild extends ScadExpression {
    public LET_PREFIX = 'let_prefix';
    public IF_PREFIX = 'if_prefix';

    forDefinition: ScadTreeItemNode = new ScadTreeItemNode(this, 'forDefinition');
    eachToken: ScadTreeItemToken = new ScadTreeItemToken(this, 'eachToken');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
    end: ScadTreeItemToken = new ScadTreeItemToken(this, 'end');
}

// === PARAMETER ====

export class ScadDefinitionParameter extends ScadInstruction {
    identifier: ScadTreeItemToken = new ScadTreeItemToken(this, 'identifier');
    equals: ScadTreeItemToken = new ScadTreeItemToken(this, 'equals');
    value: ScadTreeItemNode = new ScadTreeItemNode(this, 'value');
}

export class ScadDefinitionForSeq extends ScadExpression {
    public PARAMETER = 'parameter';
    public COMMA = 'comma';

    formark: ScadTreeItemToken = new ScadTreeItemToken(this, 'formark');
    begin_param: ScadTreeItemToken = new ScadTreeItemToken(this, 'begin_param');
    end_param: ScadTreeItemToken = new ScadTreeItemToken(this, 'end_param');
}

export class ScadDefinitionForIcn extends ScadExpression {
    public PARAMETER = 'parameter';
    public NEXT = 'next';
    public COMMA = 'comma';

    formark: ScadTreeItemToken = new ScadTreeItemToken(this, 'formark');
    begin_param: ScadTreeItemToken = new ScadTreeItemToken(this, 'begin_param');
    sep1: ScadTreeItemToken = new ScadTreeItemToken(this, 'sep1');
    condition: ScadTreeItemNode = new ScadTreeItemNode(this, 'condition');
    sep2: ScadTreeItemToken = new ScadTreeItemToken(this, 'sep2');

    end_param: ScadTreeItemToken = new ScadTreeItemToken(this, 'end_param');
}


export class ScadDefinitionLet extends ScadExpression {
    public PARAM = 'param'; // ScadDefinitionParameter
    public COMMA = 'comma';

    letmarker: ScadTreeItemToken = new ScadTreeItemToken(this, 'letmarker');
    let_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'let_start');
    let_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'let_end');
}

export class ScadDefinitionIf extends ScadExpression {

    ifmarker: ScadTreeItemToken = new ScadTreeItemToken(this, 'ifmarker');
    if_start: ScadTreeItemToken = new ScadTreeItemToken(this, 'let_start');
    condition: ScadTreeItemNode = new ScadTreeItemNode(this, 'condition');
    if_end: ScadTreeItemToken = new ScadTreeItemToken(this, 'let_end');
}


