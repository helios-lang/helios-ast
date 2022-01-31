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

export type HtmlElement =
  | { tag: "sigil"; text: string }
  | { tag: "text"; text: string }
  | { tag: "span"; classes: HtmlClass[]; children?: HtmlElementChildren };

export type HtmlElementChildren = HtmlElement | HtmlElement[];

type HtmlElementConstructor = (
  classes: HtmlClass[],
  children?: HtmlElementChildren
) => HtmlElement;

const t = (text: string): HtmlElement => ({ tag: "text", text });
t.space = { tag: "sigil", text: $g.SP } as HtmlElement;
t.newLine = { tag: "sigil", text: $g.NL } as HtmlElement;

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
      s(["keyword"], t($s.keyword.immutableBinding)),
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
  console.log(processNode(program[0]));

  return [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="stylesheet" href="lang.css" /><title>program.hl</title></head>`,
    `<pre class="source">`,
    `</pre>`,
    `<body>`,
    `</body>`,
    `</html>`,
  ].join("");
}

function processNode(node: astCommon.TopLevelNode) {
  const visitor = new HtmlifyVisitor();
  const tokens = node.accept<HtmlifyResult, typeof visitor>(visitor);
  const processed = htmlElementChildrenToStrings(tokens);
  console.log(processed.join("").trim());
}

function htmlElementChildrenToStrings(elements: HtmlElementChildren) {
  const processed: string[] = [];
  const htmlElements = Array.isArray(elements) ? elements : [elements];

  function visitHtmlElement(child: HtmlElement) {
    switch (child.tag) {
      case "span":
        processed.push(`<span class="${child.classes.join(" ")}">`);
        if (child.children) {
          if (Array.isArray(child.children)) {
            child.children.forEach(visitHtmlElement);
          } else {
            visitHtmlElement(child.children);
          }
        }
        processed.push(`</span>`);
        break;
      case "text": /* FALLTHROUGH */
      default:
        processed.push(child.text);
        break;
    }
  }

  for (const htmlElement of htmlElements) {
    visitHtmlElement(htmlElement);
  }

  return processed;
}
