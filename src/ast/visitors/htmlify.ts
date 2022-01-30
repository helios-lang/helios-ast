import * as $g from "../sigils.ts";
import * as $s from "../strings.ts";
import * as astCommon from "../common.ts";
import * as visitorCommon from "./common.ts";

import {
  BindingDeclaration,
  FunctionDeclaration,
  RecordTypeDeclaration,
} from "../decl.ts";

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
} from "../expr.ts";

export type HtmlClass =
  | "comment"
  | "function"
  | "keyword"
  | "number"
  | "operator"
  | "string";

export type HtmlElementChildren = HtmlElement | HtmlElement[];

export type HtmlElement =
  | { tag: "text"; text: string }
  | {
      tag: "div" | "span";
      classes: HtmlClass[];
      children?: HtmlElementChildren;
    };

type HtmlElementConstructor = (
  classes: HtmlClass[],
  children?: HtmlElementChildren
) => HtmlElement;

const t = (text: string): HtmlElement => ({ tag: "text", text });
t.space = { tag: "text", text: $g.SP } as HtmlElement;
t.newLine = { tag: "text", text: $g.NL } as HtmlElement;

// const d: HtmlElementConstructor = (classes, children) => ({
//   tag: "div",
//   classes,
//   children,
// });

const s: HtmlElementConstructor = (classes, children) => ({
  tag: "span",
  classes,
  children,
});

export type HtmlifyResult = HtmlElement[];

export class HtmlifyVisitor extends visitorCommon.AstVisitor<HtmlifyResult> {
  visitComment(comment: astCommon.Comment): HtmlifyResult {
    return [s(["comment"], t(comment.message))];
  }

  visitBindingDeclaration(decl: BindingDeclaration): HtmlifyResult {
    return [
      s(["keyword"]),
      t($s.keyword.immutableBinding),
      t.space,
      t(decl.identifier),
      t.space,
      s(["operator"], t($s.symbol.bindingOperator)),
      t.space,
      ...decl.value.accept<HtmlifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): HtmlifyResult {
    return [];
  }

  visitRecordTypeDeclaration(decl: RecordTypeDeclaration): HtmlifyResult {
    return [];
  }

  visitIdentifierExpression(expr: IdentifierExpression): HtmlifyResult {
    return [];
  }

  visitLiteralExpression(expr: LiteralExpression): HtmlifyResult {
    return [];
  }

  visitListExpression(expr: ListExpression): HtmlifyResult {
    return [];
  }

  visitCallExpression(expr: CallExpression): HtmlifyResult {
    return [];
  }

  visitDotExpression(expr: DotExpression): HtmlifyResult {
    return [];
  }

  visitUnaryExpression(expr: UnaryExpression): HtmlifyResult {
    return [];
  }

  visitBinaryExpression(expr: BinaryExpression): HtmlifyResult {
    return [];
  }

  visitBlockExpression(expr: BlockExpression): HtmlifyResult {
    return [];
  }

  visitLambdaExpression(expr: LambdaExpression): HtmlifyResult {
    return [];
  }
}

// -----------------------------------------------------------------------------

export function htmlify(program: astCommon.Program): string {
  const visitor = new HtmlifyVisitor();
  return "";
}
