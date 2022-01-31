import * as $g from "../sigils.ts";
import * as $s from "../strings.ts";
import * as astCommon from "../common.ts";
import * as visitorCommon from "./common.ts";

import {
  BindingDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  ImportDeclarationGroup,
  RecordTypeDeclaration,
} from "../decl.ts";

import {
  BinaryExpression,
  BlockExpression,
  CallExpression,
  DotExpression,
  LambdaExpression,
  ListExpression,
  LiteralExpression,
  TupleExpression,
  UnaryExpression,
} from "../expr.ts";

export type StringifyResult = (string | false)[];

export class StringifyVisitor extends visitorCommon.AstVisitor<StringifyResult> {
  private toSeparatedList(
    nodes: astCommon.AstNode[],
    separator = $s.symbol.listSeparator,
    addSpace = true
  ): StringifyResult {
    return nodes.flatMap((node, index, array) => {
      const stringified = node.accept<StringifyResult, this>(this);
      if (index === array.length - 1) return stringified;
      return addSpace
        ? stringified.concat(separator, $g.SP)
        : stringified.concat(separator);
    });
  }

  private toParameterList(
    parameters: (
      | astCommon.OptionallyTypedIdentifier
      | astCommon.TypedIdentifier
    )[],
    separator = $s.symbol.functionParameterSeparator
  ): StringifyResult {
    return parameters.flatMap(({ identifier, type_ }, index, array) => {
      const stringified = identifier.accept<StringifyResult, this>(this);
      if (type_) stringified.push($s.symbol.typeAnnotation, $g.SP, type_);
      if (index === array.length - 1) return stringified;
      return stringified.concat(separator, $g.SP);
    });
  }

  visitCommentNode(comment: astCommon.CommentNode): StringifyResult {
    const commentBegin = comment.isDocComment
      ? $s.symbol.docCommentBegin
      : $s.symbol.commentBegin;
    const commentEnd = comment.isDocComment
      ? $s.symbol.docCommentEnd
      : $s.symbol.commentEnd;

    return comment.message.split("\n").flatMap((content, index, array) => {
      if (content.length === 0)
        return [commentBegin, index < array.length - 1 && commentEnd];

      return [
        commentBegin,
        $g.SP,
        content,
        index < array.length - 1 && commentEnd,
      ];
    });
  }

  visitIdentifierNode(identifier: astCommon.IdentifierNode): StringifyResult {
    return [identifier.name];
  }

  visitPathNode(path: astCommon.PathNode): StringifyResult {
    return path.components.flatMap((component, index, array) => {
      const stringified = component.accept<StringifyResult, this>(this);
      if (index === array.length - 1) return stringified;
      return stringified.concat($s.symbol.pathSeparator);
    });
  }

  visitImportDeclaration(decl: ImportDeclaration): StringifyResult {
    return [
      $s.keyword.import,
      $g.SP,
      $s.symbol.importBegin,
      ...decl.path.components.flatMap((component, index, array) => {
        const stringified = component.accept<StringifyResult, this>(this);
        if (index === array.length - 1) return stringified;
        return stringified.concat($s.symbol.importSeparator);
      }),
      $s.symbol.importEnd,
    ];
  }

  visitImportDeclarationGroup(decl: ImportDeclarationGroup): StringifyResult {
    return decl.imports.flatMap((node) =>
      node.accept<StringifyResult, this>(this).concat($g.NL)
    );
  }

  visitBindingDeclaration(decl: BindingDeclaration): StringifyResult {
    return [
      $s.keyword.immutableBinding,
      $g.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      $g.SP,
      $s.symbol.bindingOperator,
      $g.SP,
      ...decl.value.accept<StringifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): StringifyResult {
    return [
      $s.keyword.function,
      $g.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      $s.symbol.functionInvokeBegin,
      ...this.toParameterList(decl.parameters),
      $s.symbol.functionInvokeEnd,
      $g.SP,
      ...(decl.returnType
        ? [$s.symbol.functionReturn, $g.SP, decl.returnType, $g.SP]
        : []),
      $s.symbol.functionBegin,
      !(decl.body instanceof BlockExpression) && $g.SP,
      ...decl.body.accept<StringifyResult, this>(this),
    ];
  }

  visitRecordTypeDeclaration(decl: RecordTypeDeclaration): StringifyResult {
    const insertBlock = Boolean(decl.fields && decl.fields?.length >= 4);

    const stringifyRecord = (): StringifyResult => {
      const body: StringifyResult = [];

      if (decl.fields && decl.fields.length > 0) {
        body.push(
          insertBlock && $g.BEGIN,
          ...decl.fields.flatMap(({ identifier, type_ }, index, array) => {
            const stringified: StringifyResult = [
              ...identifier.accept<StringifyResult, this>(this),
              $s.symbol.typeAnnotation,
              $g.SP,
              type_,
            ];
            if (index === array.length - 1) return stringified;
            return stringified.concat(
              $s.symbol.recordSeparator,
              insertBlock ? $g.CONT : $g.SP
            );
          }),
          insertBlock && $g.END
        );
      }

      return [$s.symbol.recordBegin, ...body, $s.symbol.recordEnd];
    };

    return [
      $s.keyword.type,
      $g.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      $g.SP,
      $s.symbol.typeBegin,
      ...(insertBlock
        ? [$g.BEGIN, ...stringifyRecord(), $g.END, $g.SKIP_NL]
        : [$g.SP, ...stringifyRecord(), $g.NL]),
    ];
  }

  visitLiteralExpression(expr: LiteralExpression): StringifyResult {
    return [
      `${
        expr.literal.kind === "float"
          ? expr.literal.value.toFixed(1)
          : expr.literal.value
      }`,
    ];
  }

  visitTupleExpression(expr: TupleExpression): StringifyResult {
    return [
      $s.symbol.tupleBegin,
      ...this.toSeparatedList(expr.contents, $s.symbol.tupleSeparator),
      $s.symbol.tupleEnd,
    ];
  }

  visitListExpression(expr: ListExpression): StringifyResult {
    return [
      $s.symbol.listBegin,
      ...this.toSeparatedList(expr.contents),
      $s.symbol.listEnd,
    ];
  }

  visitCallExpression(expr: CallExpression): StringifyResult {
    return [
      ...expr.function_.accept<StringifyResult, this>(this),
      $s.symbol.functionInvokeBegin,
      ...this.toSeparatedList(
        expr.arguments_,
        $s.symbol.functionParameterSeparator
      ),
      $s.symbol.functionInvokeEnd,
    ];
  }

  visitDotExpression(expr: DotExpression): StringifyResult {
    return expr.components.flatMap((component, index, array) => {
      const stringified =
        typeof component === "string"
          ? component
          : component.accept<StringifyResult, this>(this);
      if (index === array.length - 1) return stringified;
      return stringified.concat($s.symbol.recordPathSeparator);
    });
  }

  visitUnaryExpression(expr: UnaryExpression): StringifyResult {
    return [
      expr.operator,
      ...expr.expression.accept<StringifyResult, this>(this),
    ];
  }

  visitBinaryExpression(expr: BinaryExpression): StringifyResult {
    return [
      ...expr.lhs.accept<StringifyResult, this>(this),
      $g.SP,
      expr.operator,
      $g.SP,
      ...expr.rhs.accept<StringifyResult, this>(this),
    ];
  }

  visitBlockExpression(expr: BlockExpression): StringifyResult {
    return [
      $g.BEGIN,
      ...this.toSeparatedList(expr.items, $g.CONT, false),
      $g.END,
    ];
  }

  visitLambdaExpression(expr: LambdaExpression): StringifyResult {
    return [
      $s.keyword.lambda,
      ...this.toParameterList(expr.parameters),
      $g.SP,
      $s.symbol.lambdaBegin,
      $g.SP,
      ...expr.body.accept<StringifyResult, this>(this),
    ];
  }
}

// -----------------------------------------------------------------------------

type StringifyOptions = {
  indentationCount?: number;
  stripComments?: boolean;
};

export function stringify(
  program: astCommon.Program,
  options: StringifyOptions = {}
): string {
  let _program = program;
  if (options.stripComments) {
    _program = program.filter(
      (item) => !(item instanceof astCommon.CommentNode)
    );
  }

  const processTopLevelNodes = (node: astCommon.TopLevelNode) => [
    ...processIndentsForNode(node, options.indentationCount ?? 2),
    $g.NL,
  ];

  return _program.flatMap(processTopLevelNodes).join("").trim();
}

function processIndentsForNode(
  node: astCommon.TopLevelNode,
  indentationCount: number
) {
  const visitor = new StringifyVisitor();
  const tokens = node
    .accept<StringifyResult, typeof visitor>(visitor)
    .filter((token): token is string => Boolean(token));

  const processedTokens: string[] = [];
  for (const token of processIndentsGenerator(tokens, indentationCount)) {
    processedTokens.push(token);
  }

  return processedTokens;
}

function* processIndentsGenerator(tokens: string[], indentationCount: number) {
  let currIndent = 0;
  for (const token of tokens) {
    if (!token.startsWith("<!--")) {
      yield token;
    } else {
      if (token === $g.SKIP_NL) continue;
      else yield $g.NL;

      switch (token) {
        case $g.BEGIN:
          currIndent += indentationCount;
          yield indent(currIndent);
          break;
        case $g.CONT:
          yield indent(currIndent);
          break;
        case $g.END:
          currIndent = Math.max(0, currIndent - indentationCount);
          yield indent(currIndent);
          break;
        case $g.RESET:
          currIndent = 0;
          break;
        default:
          yield token;
      }
    }
  }
}

function indent(times: number) {
  return $g.SP.repeat(Math.max(0, times));
}
