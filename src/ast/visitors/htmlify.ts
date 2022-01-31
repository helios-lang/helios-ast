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
  BinaryExpression,
  BlockExpression,
  CallExpression,
  DotExpression,
  IdentifierExpression,
  LambdaExpression,
  ListExpression,
  LiteralExpression,
  TupleExpression,
  UnaryExpression,
} from "../expr.ts";

export enum HtmlClass {
  COMMENT = "cmt",
  CONSTRUCTOR = "con",
  FUNCTION = "fun",
  IDENTIFIER = "idt",
  KEYWORD = "kwd",
  MODULE = "mod",
  NUMBER = "num",
  OPERATOR = "opr",
  STRING = "str",
  SYMBOL = "sym",
  TYPE = "typ",
}

export type HtmlElement =
  | { tag: "sigil"; text: string }
  | { tag: "text"; text: string }
  | { tag: "span"; classes: HtmlClass[]; children?: HtmlElement[] };

const t = (text: string): HtmlElement => ({ tag: "text", text });

const g = {
  space: { tag: "sigil", text: $g.SP } as HtmlElement,
  newLine: { tag: "sigil", text: $g.NL } as HtmlElement,
  begin: { tag: "sigil", text: $g.BEGIN } as HtmlElement,
  cont: { tag: "sigil", text: $g.CONT } as HtmlElement,
  end: { tag: "sigil", text: $g.END } as HtmlElement,
  skipNewLine: { tag: "sigil", text: $g.SKIP_NL } as HtmlElement,
  reset: { tag: "sigil", text: $g.RESET } as HtmlElement,
};

type HtmlElementConstructor = (
  classes: HtmlClass[],
  children?: HtmlElement | HtmlElement[]
) => HtmlElement;

const s: HtmlElementConstructor = (classes, children = undefined) => ({
  tag: "span",
  classes,
  children: children
    ? Array.isArray(children)
      ? children
      : [children]
    : undefined,
});

export type HtmlifyResult = (false | HtmlElement)[];

export class HtmlifyVisitor extends visitorCommon.AstVisitor<HtmlifyResult> {
  private toSeparatedList(
    nodes: astCommon.AstNode[],
    separator = s([HtmlClass.SYMBOL], t($s.symbol.listSeparator)),
    addSpace = true
  ): HtmlifyResult {
    return nodes.flatMap((node, index, array) => {
      const htmlified = node.accept<HtmlifyResult, this>(this);
      if (index === array.length - 1) return htmlified;
      return addSpace
        ? htmlified.concat(separator, g.space)
        : htmlified.concat(separator);
    });
  }

  private toParameterList(
    parameters: (
      | astCommon.OptionallyTypedIdentifier
      | astCommon.TypedIdentifier
    )[],
    separator = s([HtmlClass.SYMBOL], t($s.symbol.functionParameterSeparator))
  ): readonly [HtmlifyResult, boolean] {
    let hasAnnotation = false;

    const list = parameters.flatMap(({ identifier, type_ }, index, array) => {
      const htmlified: HtmlifyResult = [t(identifier)];

      if (type_) {
        if (!hasAnnotation) hasAnnotation = true;
        htmlified.push(
          s([HtmlClass.SYMBOL], t($s.symbol.typeAnnotation)),
          g.space,
          s([HtmlClass.TYPE], t(type_))
        );
      }

      if (index === array.length - 1) return htmlified;
      return htmlified.concat(separator, g.space);
    });

    return [list, hasAnnotation] as const;
  }

  visitComment(comment: astCommon.Comment): HtmlifyResult {
    return [
      s(
        [HtmlClass.COMMENT],
        t(comment.message.trim().length > 0 ? `## ${comment.message}` : "##")
      ),
    ];
  }

  visitBindingDeclaration(decl: BindingDeclaration): HtmlifyResult {
    return [
      s([HtmlClass.KEYWORD], t($s.keyword.immutableBinding)),
      g.space,
      s([HtmlClass.IDENTIFIER], t(decl.identifier)),
      g.space,
      s([HtmlClass.OPERATOR], t($s.symbol.bindingOperator)),
      g.space,
      ...decl.value.accept<HtmlifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): HtmlifyResult {
    return [
      s([HtmlClass.KEYWORD], t($s.keyword.function)),
      g.space,
      s([HtmlClass.FUNCTION], t(decl.identifier)),
      s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeBegin)),
      ...this.toParameterList(decl.parameters)[0],
      s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeEnd)),
      g.space,
      ...(decl.returnType
        ? [
            t($s.symbol.functionReturn),
            g.space,
            s([HtmlClass.TYPE], t(decl.returnType)),
            g.space,
          ]
        : []),
      s([HtmlClass.SYMBOL], t($s.symbol.functionBegin)),
      !(decl.body instanceof BlockExpression) && g.space,
      ...decl.body.accept<HtmlifyResult, this>(this),
    ];
  }

  visitRecordTypeDeclaration(decl: RecordTypeDeclaration): HtmlifyResult {
    const insertBlock = Boolean(decl.fields && decl.fields.length >= 4);

    function stringifyRecord(): HtmlifyResult {
      const body: HtmlifyResult = [];

      if (decl.fields && decl.fields.length > 0) {
        body.push(
          insertBlock && g.begin,
          ...decl.fields.flatMap(({ identifier, type_ }, index, array) => {
            const htmlified: HtmlifyResult = [
              // s([HtmlClass.IDENTIFIER], t(identifier)),
              // s([HtmlClass.SYMBOL], t($s.symbol.typeAnnotation)),
              s(
                [HtmlClass.CONSTRUCTOR],
                t(`${identifier}${$s.symbol.typeAnnotation}`)
              ),
              g.space,
              s([HtmlClass.TYPE], t(type_)),
            ];

            if (index === array.length - 1) return htmlified;
            return htmlified.concat(
              s([HtmlClass.SYMBOL], t($s.symbol.recordSeparator)),
              insertBlock ? g.cont : g.space
            );
          }),
          insertBlock && g.end
        );
      }

      return [
        s([HtmlClass.CONSTRUCTOR], t($s.symbol.recordBegin)),
        ...body,
        s([HtmlClass.CONSTRUCTOR], t($s.symbol.recordEnd)),
      ];
    }

    return [
      s([HtmlClass.KEYWORD], t($s.keyword.type)),
      g.space,
      s([HtmlClass.TYPE], t(decl.identifier)),
      g.space,
      s([HtmlClass.SYMBOL], t($s.symbol.typeBegin)),
      ...(insertBlock
        ? [g.begin, ...stringifyRecord(), g.end, g.skipNewLine]
        : [g.space, ...stringifyRecord(), g.newLine]),
    ];
  }

  visitIdentifierExpression(expr: IdentifierExpression): HtmlifyResult {
    return [s([HtmlClass.IDENTIFIER], t(expr.identifier))];
  }

  visitLiteralExpression(expr: LiteralExpression): HtmlifyResult {
    switch (expr.literal.kind) {
      case "boolean":
        return [
          s([HtmlClass.CONSTRUCTOR], t(expr.literal.value ? "True" : "False")),
        ];
      case "integer":
        return [s([HtmlClass.NUMBER], t(expr.literal.value.toString()))];
      case "float":
        return [s([HtmlClass.NUMBER], t(expr.literal.value.toFixed(1)))];
      case "string":
      default:
        return [s([HtmlClass.STRING], t(`"${expr.literal.value}"`))];
    }
  }

  visitTupleExpression(expr: TupleExpression): HtmlifyResult {
    return [
      s([HtmlClass.SYMBOL], t($s.symbol.tupleBegin)),
      ...this.toSeparatedList(
        expr.contents,
        s([HtmlClass.SYMBOL], t($s.symbol.tupleSeparator))
      ),
      s([HtmlClass.SYMBOL], t($s.symbol.tupleEnd)),
    ];
  }

  visitListExpression(expr: ListExpression): HtmlifyResult {
    return [
      s([HtmlClass.SYMBOL], t($s.symbol.listBegin)),
      ...this.toSeparatedList(expr.contents),
      s([HtmlClass.SYMBOL], t($s.symbol.listEnd)),
    ];
  }

  visitCallExpression(expr: CallExpression): HtmlifyResult {
    const stringifiedFunctionName: HtmlifyResult = [];

    if (typeof expr.function_ === "string") {
      stringifiedFunctionName.push(s([HtmlClass.FUNCTION], t(expr.function_)));
    } else {
      expr.function_.forEach((component, index, array) => {
        stringifiedFunctionName.push(s([HtmlClass.MODULE], t(component)));
        if (index < array.length - 1)
          stringifiedFunctionName.push(
            s([HtmlClass.SYMBOL], t($s.symbol.modulePathSeparator))
          );
      });
    }

    return [
      ...stringifiedFunctionName,
      s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeBegin)),
      ...this.toSeparatedList(
        expr.arguments_,
        s([HtmlClass.SYMBOL], t($s.symbol.functionParameterSeparator))
      ),
      s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeEnd)),
    ];
  }

  visitDotExpression(expr: DotExpression): HtmlifyResult {
    return expr.components.flatMap((component, index, array) => {
      const htmlified: HtmlifyResult = [];

      if (typeof component === "string") {
        htmlified.push(s([HtmlClass.IDENTIFIER], t(component)));
      } else {
        htmlified.push(...component.accept<HtmlifyResult, this>(this));
      }

      if (index < array.length - 1) {
        htmlified.push(s([HtmlClass.SYMBOL], t($s.symbol.recordPathSeparator)));
      }

      return htmlified;
    });
  }

  visitUnaryExpression(expr: UnaryExpression): HtmlifyResult {
    return [
      s([HtmlClass.SYMBOL], t(expr.operator)),
      ...expr.expression.accept<HtmlifyResult, this>(this),
    ];
  }

  visitBinaryExpression(expr: BinaryExpression): HtmlifyResult {
    return [
      ...expr.lhs.accept<HtmlifyResult, this>(this),
      g.space,
      s([HtmlClass.SYMBOL], t(expr.operator)),
      g.space,
      ...expr.rhs.accept<HtmlifyResult, this>(this),
    ];
  }

  visitBlockExpression(expr: BlockExpression): HtmlifyResult {
    return [g.begin, ...this.toSeparatedList(expr.items, g.cont, false), g.end];
  }

  visitLambdaExpression(expr: LambdaExpression): HtmlifyResult {
    const [paramList, hasAnnotation] = this.toParameterList(expr.parameters);

    return [
      s([HtmlClass.KEYWORD], t($s.keyword.lambda)),
      hasAnnotation && s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeBegin)),
      ...paramList,
      hasAnnotation && s([HtmlClass.SYMBOL], t($s.symbol.functionInvokeEnd)),
      g.space,
      s([HtmlClass.SYMBOL], t($s.symbol.lambdaBegin)),
      g.space,
      ...expr.body.accept<HtmlifyResult, this>(this),
    ];
  }
}

// -----------------------------------------------------------------------------

type HtmlifyOptions = {
  indentationCount?: number;
  stripComments?: boolean;
};

export function htmlify(
  program: astCommon.Program,
  options: HtmlifyOptions = {}
): string {
  let _program = program;
  if (options.stripComments) {
    _program = program.filter((item) => !(item instanceof astCommon.Comment));
  }

  const source = _program
    .flatMap((node) => [
      ...processNode(node, options.indentationCount ?? 2),
      $g.NL,
    ])
    .join("")
    .trim();

  return [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="stylesheet" href="lang.css" /><title>program.hl</title></head>`,
    `<pre class="source">`,
    source,
    `</pre>`,
    `<body>`,
    `</body>`,
    `</html>`,
  ].join("");
}

function processNode(node: astCommon.TopLevelNode, indentationCount: number) {
  const visitor = new HtmlifyVisitor();
  const tokens = node
    .accept<HtmlifyResult, typeof visitor>(visitor)
    .filter((token): token is HtmlElement => Boolean(token));

  return htmlElementsToStrings(tokens, indentationCount);
}

function htmlElementsToStrings(
  elements: HtmlElement[],
  indentationCount: number
) {
  let currIndent = 0;
  const processed: string[] = [];
  const htmlElements = Array.isArray(elements) ? elements : [elements];

  function visitHtmlElement(child: HtmlElement) {
    switch (child.tag) {
      case "sigil": {
        if (child.text === $g.SP) {
          processed.push($g.SP);
          return;
        }

        if (child.text === $g.SKIP_NL) {
          return;
        } else {
          processed.push($g.NL);
        }

        if (child.text === $g.BEGIN) {
          currIndent += indentationCount;
          processed.push(indent(currIndent));
        } else if (child.text === $g.CONT) {
          processed.push(indent(currIndent));
        } else if (child.text === $g.END) {
          currIndent = Math.max(0, currIndent - indentationCount);
          processed.push(indent(currIndent));
        } else if (child.text === $g.RESET) {
          currIndent = 0;
          processed.push(indent(currIndent));
        } else {
          return;
        }

        break;
      }
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

function indent(times: number) {
  return $g.SP.repeat(Math.max(0, times));
}
