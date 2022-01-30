import * as $s from "./strings.ts";
import * as $g from "./sigils.ts";
import * as common from "./common.ts";

import {
  BindingDeclaration,
  FunctionDeclaration,
  RecordTypeDeclaration,
} from "./decl.ts";

import {
  IdentifierExpression,
  LiteralExpression,
  ListExpression,
  CallExpression,
  DotExpression,
  UnaryExpression,
  BinaryExpression,
  BlockExpression,
  LambdaExpression,
} from "./expr.ts";

export abstract class AstVisitor<R> {
  // --- MISCELLANEOUS ---

  abstract visitComment(comment: common.Comment): R;

  // --- DECLARATIONS ---

  abstract visitBindingDeclaration(decl: BindingDeclaration): R;
  abstract visitFunctionDeclaration(decl: FunctionDeclaration): R;
  abstract visitRecordTypeDeclaration(decl: RecordTypeDeclaration): R;

  // --- EXPRESSIONS ---

  abstract visitIdentifierExpression(expr: IdentifierExpression): R;
  abstract visitLiteralExpression(expr: LiteralExpression): R;
  abstract visitListExpression(expr: ListExpression): R;
  abstract visitCallExpression(expr: CallExpression): R;
  abstract visitDotExpression(expr: DotExpression): R;
  abstract visitUnaryExpression(expr: UnaryExpression): R;
  abstract visitBinaryExpression(expr: BinaryExpression): R;
  abstract visitBlockExpression(expr: BlockExpression): R;
  abstract visitLambdaExpression(expr: LambdaExpression): R;
}

export type StringifyResult = (string | false)[];

export class StringifyVisitor extends AstVisitor<StringifyResult> {
  private toSeparatedList(
    nodes: common.AstNode[],
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
    parameters: (common.OptionallyTypedIdentifier | common.TypedIdentifier)[],
    separator = $s.symbol.functionParameterSeparator
  ): StringifyResult {
    return parameters.flatMap(({ identifier, type_ }, index, array) => {
      const stringified: StringifyResult = [identifier];
      if (type_) stringified.push($s.symbol.typeAnnotation, $g.SP, type_);
      if (index === array.length - 1) return stringified;
      return stringified.concat(separator, $g.SP);
    });
  }

  visitComment(comment: common.Comment): StringifyResult {
    return [
      $s.symbol.commentStart,
      comment.message.trim().length > 0 && $g.SP,
      comment.message,
    ];
  }

  visitBindingDeclaration(decl: BindingDeclaration): StringifyResult {
    return [
      $s.keyword.immutableBinding,
      $g.SP,
      decl.identifier,
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
      decl.identifier,
      $g.SP,
      $s.symbol.functionInvokeStart,
      $s.symbol.functionInvokeEnd,
      $g.SP,
      $s.symbol.functionBegin,
      ...decl.body.accept<StringifyResult, this>(this),
    ];
  }

  visitRecordTypeDeclaration(decl: RecordTypeDeclaration): StringifyResult {
    function stringifyRecord(): StringifyResult {
      const body: StringifyResult = [];
      if (decl.fields) {
        body.push(
          $g.BEGIN,
          ...decl.fields.flatMap(({ identifier, type_ }, index, array) => {
            const stringified: StringifyResult = [
              identifier,
              $s.symbol.typeAnnotation,
              $g.SP,
              type_,
            ];
            if (index === array.length - 1) return stringified;
            return stringified.concat($s.symbol.recordSeparator, $g.CONT);
          }),
          $g.END
        );
      }

      return [$s.symbol.recordBegin, ...body, $s.symbol.recordEnd];
    }

    return [
      $s.keyword.type,
      $g.SP,
      decl.identifier,
      $g.SP,
      $s.symbol.typeBegin,
      ...(decl.fields
        ? [$g.BEGIN, ...stringifyRecord(), $g.END, $g.SKIP_NL]
        : [$g.SP, ...stringifyRecord()]),
    ];
  }

  visitIdentifierExpression(expr: IdentifierExpression): StringifyResult {
    return [expr.identifier];
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

  visitListExpression(expr: ListExpression): StringifyResult {
    return [
      "[",
      ...this.toSeparatedList(expr.contents, $s.symbol.listSeparator),
      "]",
    ];
  }

  visitCallExpression(expr: CallExpression): StringifyResult {
    return [
      typeof expr.function_ === "string"
        ? expr.function_
        : expr.function_.join($s.symbol.modulePathSeparator),
      $s.symbol.functionInvokeStart,
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
