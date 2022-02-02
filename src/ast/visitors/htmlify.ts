import * as sigils from "../sigils.ts";
import * as astCommon from "../common.ts";
import * as visitorCommon from "./common.ts";

import {
  BindingDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  ImportDeclarationGroup,
  TypeDeclaration,
} from "../decl.ts";

import {
  BinaryExpression,
  BlockExpression,
  CallExpression,
  DotExpression,
  InterpolatedStringExpression,
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

type SigilHtmlElement = { tag: "sigil"; text: string };
type TextHtmlElement = { tag: "text"; text: string };
type SpanHtmlElement = {
  tag: "span";
  classes: HtmlClass[];
  children?: HtmlElement[];
};

export type HtmlElement = SigilHtmlElement | TextHtmlElement | SpanHtmlElement;

const t = (text: string): HtmlElement => ({ tag: "text", text });

const g = {
  SP: { tag: "sigil", text: sigils.SP } as HtmlElement,
  NL: { tag: "sigil", text: sigils.NL } as HtmlElement,
  BEGIN: { tag: "sigil", text: sigils.BEGIN } as HtmlElement,
  CONT: { tag: "sigil", text: sigils.CONT } as HtmlElement,
  END: { tag: "sigil", text: sigils.END } as HtmlElement,
  SKIP_NL: { tag: "sigil", text: sigils.SKIP_NL } as HtmlElement,
  RESET: { tag: "sigil", text: sigils.RESET } as HtmlElement,
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
    nodes: ReadonlyArray<astCommon.AstNode>,
    separator = s([HtmlClass.SYMBOL], t(this.symbols.listSeparator)),
    addSpace = true
  ): HtmlifyResult {
    return nodes.flatMap((node, index, array) => {
      const htmlified = node.accept<HtmlifyResult, this>(this);
      if (index === array.length - 1) return htmlified;
      return addSpace
        ? htmlified.concat(separator, g.SP)
        : htmlified.concat(separator);
    });
  }

  private toParameterList(
    parameters: ReadonlyArray<astCommon.MaybeTypedIdentifier>,
    separator = s(
      [HtmlClass.SYMBOL],
      t(this.symbols.functionParameterSeparator)
    )
  ): readonly [HtmlifyResult, boolean] {
    let hasAnnotation = false;

    const list = parameters.flatMap(
      ({ identifier, identifierType }, index, array) => {
        const htmlified: HtmlifyResult = identifier.accept(this);

        if (identifierType) {
          if (!hasAnnotation) hasAnnotation = true;
          htmlified.push(
            s([HtmlClass.SYMBOL], t(this.symbols.typeAnnotation)),
            g.SP,
            ...identifierType.accept<HtmlifyResult, this>(this)
          );
        }

        if (index === array.length - 1) return htmlified;
        return htmlified.concat(separator, g.SP);
      }
    );

    return [list, hasAnnotation] as const;
  }

  visitCommentNode(node: astCommon.CommentNode): HtmlifyResult {
    return node.comment.split("\n").flatMap((line, index, array) => {
      const commentBegin = node.isDocComment
        ? this.symbols.docCommentBegin
        : this.symbols.commentBegin;
      return [
        s(
          [HtmlClass.COMMENT],
          t(line.length > 0 ? commentBegin + sigils.SP + line : commentBegin)
        ),
        index < array.length - 1 && g.NL,
      ];
    });
  }

  visitIdentifierNode(node: astCommon.IdentifierNode): HtmlifyResult {
    return [s([HtmlClass.IDENTIFIER], t(node.name))];
  }

  visitModuleNode(node: astCommon.IdentifierNode): HtmlifyResult {
    return [s([HtmlClass.MODULE], t(node.name))];
  }

  visitTypeNode({ child }: astCommon.TypeNode): HtmlifyResult {
    if (child instanceof astCommon.IdentifierNode) {
      return [s([HtmlClass.TYPE], t(child.name))];
    } else if (child instanceof astCommon.PathNode) {
      const { components } = child;
      return components.flatMap((component, index, array) => {
        if (index === array.length - 1)
          return [s([HtmlClass.TYPE], t(component.name))];
        return [
          s([HtmlClass.MODULE], t(component.name)),
          s([HtmlClass.SYMBOL], t(this.symbols.pathSeparator)),
        ];
      });
    } else {
      return child.accept(this);
    }
  }

  visitAnonymousRecordNode(node: astCommon.AnonymousRecordNode): HtmlifyResult {
    const multiline = Boolean(node.fields && node.fields.length >= 4);
    const body: HtmlifyResult = [];

    if (node.fields && node.fields.length > 0) {
      body.push(
        multiline && g.BEGIN,
        ...node.fields.flatMap(
          ({ identifier, identifierType }, index, array) => {
            const isAtEnd = index === array.length - 1;
            const htmlified: HtmlifyResult = [
              s(
                [HtmlClass.CONSTRUCTOR],
                t(`${identifier.name}${this.symbols.typeAnnotation}`)
              ),
              g.SP,
              ...identifierType.accept<HtmlifyResult, this>(this),
            ];

            const pushRecordSeparator = () =>
              htmlified.push(
                s([HtmlClass.SYMBOL], t(this.symbols.recordSeparator))
              );

            if (multiline) {
              if (!isAtEnd) {
                pushRecordSeparator();
                htmlified.push(g.CONT);
              } else if (this.options.preferTrailingSeparators) {
                pushRecordSeparator();
              }
            } else {
              if (!isAtEnd) {
                pushRecordSeparator();
                htmlified.push(g.SP);
              }
            }

            return htmlified;
          }
        ),
        multiline && g.END
      );
    }

    return [
      multiline && g.BEGIN,
      s([HtmlClass.CONSTRUCTOR], t(this.symbols.recordBegin)),
      ...body,
      s([HtmlClass.CONSTRUCTOR], t(this.symbols.recordEnd)),
      multiline && g.RESET,
      multiline && g.SKIP_NL,
    ];
  }

  visitPathNode(node: astCommon.PathNode): HtmlifyResult {
    return node.components.flatMap((component, index, array) => {
      const htmlified = [
        s(
          [HtmlClass.MODULE],
          t(
            this.options.uppercaseModules
              ? astCommon.capitalizeModuleName(component.name)
              : component.name
          )
        ),
      ];
      if (index === array.length - 1) return htmlified;
      return htmlified.concat(
        s([HtmlClass.SYMBOL], t(this.symbols.pathSeparator))
      );
    });
  }

  visitImportDeclaration(decl: ImportDeclaration): HtmlifyResult {
    const importContents: HtmlifyResult = [
      s([HtmlClass.KEYWORD], t(this.keywords.import)),
      g.SP,
    ];

    if (this.options.stringImports) {
      importContents.push(
        s(
          [HtmlClass.STRING],
          [
            t(this.symbols.stringBegin),
            ...this.toSeparatedList(decl.path.components, t("/"), false).filter(
              (element): element is HtmlElement => Boolean(element)
            ),
            t(this.symbols.stringEnd),
          ]
        )
      );
    } else {
      importContents.push(
        ...decl.path.components.flatMap((components, index, array) => {
          const htmlified = [
            s(
              [HtmlClass.MODULE],
              t(
                this.options.uppercaseModules
                  ? astCommon.capitalizeModuleName(components.name)
                  : components.name
              )
            ),
          ];
          if (index === array.length - 1) return htmlified;
          return htmlified.concat(t(this.symbols.pathSeparator));
        })
      );
    }

    return importContents;
  }

  visitImportDeclarationGroup(decl: ImportDeclarationGroup): HtmlifyResult {
    return decl.imports.flatMap((node) =>
      node.accept<HtmlifyResult, this>(this).concat(g.NL)
    );
  }

  visitBindingDeclaration(decl: BindingDeclaration): HtmlifyResult {
    return [
      s([HtmlClass.KEYWORD], t(this.keywords.immutableBinding)),
      g.SP,
      ...decl.identifier.accept<HtmlifyResult, this>(this),
      g.SP,
      s([HtmlClass.OPERATOR], t(this.symbols.bindingOperator)),
      g.SP,
      ...decl.value.accept<HtmlifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): HtmlifyResult {
    return [
      s([HtmlClass.KEYWORD], t(this.keywords.function)),
      g.SP,
      s([HtmlClass.FUNCTION], t(decl.identifier.name)),
      s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeBegin)),
      ...this.toParameterList(decl.parameters)[0],
      s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeEnd)),
      g.SP,
      ...(decl.returnType
        ? [
            t(this.symbols.functionReturn),
            g.SP,
            ...decl.returnType.accept<HtmlifyResult, this>(this),
            g.SP,
          ]
        : []),
      s([HtmlClass.SYMBOL], t(this.symbols.functionBegin)),
      !(decl.body instanceof BlockExpression) && g.SP,
      ...decl.body.accept<HtmlifyResult, this>(this),
    ];
  }

  visitTypeDeclaration(decl: TypeDeclaration): HtmlifyResult {
    return [
      s([HtmlClass.KEYWORD], t(this.keywords.type)),
      g.SP,
      s([HtmlClass.TYPE], t(decl.identifier.name)),
      g.SP,
      s([HtmlClass.SYMBOL], t(this.symbols.typeBegin)),
      g.SP,
      ...decl.body.accept<HtmlifyResult, this>(this),
      g.NL,
    ];
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
        return [
          s(
            [HtmlClass.STRING],
            t(
              this.symbols.stringBegin +
                expr.literal.value +
                this.symbols.stringEnd
            )
          ),
        ];
    }
  }

  visitInterpolatedStringExpression(
    expr: InterpolatedStringExpression
  ): HtmlifyResult {
    return expr.components.flatMap((component, index, array) => {
      if (typeof component === "string") {
        const strings: string[] = [];
        if (index === 0) strings.push(this.symbols.stringBegin);
        strings.push(component);
        if (index === array.length - 1) strings.push(this.symbols.stringEnd);
        return s([HtmlClass.STRING], t(strings.join("")));
      } else {
        return [
          s([HtmlClass.KEYWORD], t(this.symbols.stringInterpolationBegin)),
          ...component.accept<HtmlifyResult, this>(this),
          s([HtmlClass.KEYWORD], t(this.symbols.stringInterpolationEnd)),
        ];
      }
    });
  }

  visitTupleExpression(expr: TupleExpression): HtmlifyResult {
    return [
      s([HtmlClass.SYMBOL], t(this.symbols.tupleBegin)),
      ...this.toSeparatedList(
        expr.contents,
        s([HtmlClass.SYMBOL], t(this.symbols.tupleSeparator))
      ),
      s([HtmlClass.SYMBOL], t(this.symbols.tupleEnd)),
    ];
  }

  visitListExpression(expr: ListExpression): HtmlifyResult {
    return [
      s([HtmlClass.SYMBOL], t(this.symbols.listBegin)),
      ...this.toSeparatedList(expr.contents),
      s([HtmlClass.SYMBOL], t(this.symbols.listEnd)),
    ];
  }

  visitCallExpression(expr: CallExpression): HtmlifyResult {
    const htmlifiedFunctionIdentifier: HtmlifyResult = [];

    if (expr.function_ instanceof astCommon.IdentifierNode) {
      htmlifiedFunctionIdentifier.push(
        s([HtmlClass.FUNCTION], t(expr.function_.name))
      );
    } else {
      const components = expr.function_.components;
      const allButLast = components.slice(0, -1);
      const last = components.at(-1);

      htmlifiedFunctionIdentifier.push(
        ...new astCommon.PathNode(allButLast).accept<HtmlifyResult, this>(this)
      );

      if (last) {
        htmlifiedFunctionIdentifier.push(
          s([HtmlClass.SYMBOL], t(this.symbols.pathSeparator)),
          s([HtmlClass.FUNCTION], t(last.name))
        );
      }
    }

    return [
      ...htmlifiedFunctionIdentifier,
      s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeBegin)),
      ...this.toSeparatedList(
        expr.arguments_,
        s([HtmlClass.SYMBOL], t(this.symbols.functionParameterSeparator))
      ),
      s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeEnd)),
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
        htmlified.push(
          s([HtmlClass.SYMBOL], t(this.symbols.recordPathSeparator))
        );
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
      g.SP,
      s([HtmlClass.SYMBOL], t(expr.operator)),
      g.SP,
      ...expr.rhs.accept<HtmlifyResult, this>(this),
    ];
  }

  visitBlockExpression(expr: BlockExpression): HtmlifyResult {
    return [g.BEGIN, ...this.toSeparatedList(expr.items, g.CONT, false), g.END];
  }

  visitLambdaExpression(expr: LambdaExpression): HtmlifyResult {
    const [paramList, hasAnnotation] = this.toParameterList(expr.parameters);

    return [
      s([HtmlClass.KEYWORD], t(this.keywords.lambda)),
      hasAnnotation &&
        s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeBegin)),
      ...paramList,
      hasAnnotation && s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeEnd)),
      g.SP,
      s([HtmlClass.SYMBOL], t(this.symbols.lambdaBegin)),
      g.SP,
      ...expr.body.accept<HtmlifyResult, this>(this),
    ];
  }
}

// -----------------------------------------------------------------------------

// deno-lint-ignore no-empty-interface
interface HtmlifyOptions extends visitorCommon.AstVisitorOptions {}

export function htmlify(
  program: astCommon.Program,
  options: HtmlifyOptions = {}
): string {
  let _program = program;
  if (options.stripComments) {
    _program = program.filter(
      (item) => !(item instanceof astCommon.CommentNode)
    );
  }

  const table = _program
    .flatMap((node) => [...processNode(node, options), sigils.NL])
    .join("")
    .trim()
    .split("\n")
    .map((line, index) => {
      return [
        `<tr>`,
        `<td id="L${index + 1}" class="blob number">${index + 1}</td>`,
        `<td class="blob line">${line}</td>`,
        `</tr>`,
      ].join("");
    })
    .join("")
    .trim();

  return [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="stylesheet" href="lang.css" /><title>program.hl</title></head>`,
    `<body>`,
    `<table><tbody>\n`,
    table,
    `</tbody></table>`,
    `</body>`,
    `</html>`,
  ].join("");
}

function processNode(node: astCommon.TopLevelNode, options: HtmlifyOptions) {
  const visitor = new HtmlifyVisitor(options);
  const tokens = node
    .accept<HtmlifyResult, typeof visitor>(visitor)
    .filter((token): token is HtmlElement => Boolean(token));

  return htmlElementsToStrings(tokens, options.indentationCount ?? 2);
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
        if (child.text === sigils.SP) {
          processed.push("&nbsp;");
          return;
        }

        if (child.text === sigils.SKIP_NL) {
          return;
        } else {
          processed.push(sigils.NL);
        }

        if (child.text === sigils.BEGIN) {
          currIndent += indentationCount;
          processed.push(indent(currIndent));
        } else if (child.text === sigils.CONT) {
          processed.push(indent(currIndent));
        } else if (child.text === sigils.END) {
          currIndent = Math.max(0, currIndent - indentationCount);
          processed.push(indent(currIndent));
        } else if (child.text === sigils.RESET) {
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
  return "&nbsp;".repeat(Math.max(0, times));
}
