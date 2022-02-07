import { escapeHtml } from 'https://deno.land/x/escape@1.4.2/mod.ts';

import * as sigils from '../sigils.ts';
import * as astCommon from '../common.ts';
import * as visitorCommon from './common.ts';
import { FILE_EXTENSION } from '../strings.ts';

import {
  BindingDeclaration,
  ConstructorDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  ImportDeclarationGroup,
  ProductTypeDeclaration,
  SumTypeDeclaration,
  TypeAliasDeclaration,
} from '../decl.ts';

import {
  BinaryExpression,
  BlockExpression,
  CallExpression,
  CaseExpression,
  ConstructorExpression,
  DotExpression,
  IfExpression,
  InterpolatedStringExpression,
  LambdaExpression,
  ListExpression,
  LiteralExpression,
  TupleExpression,
  UnaryExpression,
} from '../expr.ts';

export enum HtmlClass {
  COMMENT = 'cmt',
  CONSTRUCTOR = 'con',
  FUNCTION = 'fun',
  GENERIC = 'gen',
  IDENTIFIER = 'idt',
  KEYWORD = 'kwd',
  MODULE = 'mod',
  NUMBER = 'num',
  OPERATOR = 'opr',
  STRING = 'str',
  SYMBOL = 'sym',
  TYPE = 'typ',
}

type SigilHtmlElement = { tag: 'sigil'; text: string };
type TextHtmlElement = { tag: 'text'; text: string };

type LinkHtmlElement = {
  tag: 'link';
  link: string;
  children?: HtmlElement[];
};

type SpanHtmlElement = {
  tag: 'span';
  classes: HtmlClass[];
  children?: HtmlElement[];
  tooltipText?: string;
};

type HtmlElement =
  | SigilHtmlElement
  | TextHtmlElement
  | LinkHtmlElement
  | SpanHtmlElement;

type MaybeHtmlElement = false | HtmlElement;
export type HtmlifyResult = MaybeHtmlElement[];

const g = {
  SP: { tag: 'sigil', text: sigils.SP } as HtmlElement,
  NL: { tag: 'sigil', text: sigils.NL } as HtmlElement,
  BEGIN: { tag: 'sigil', text: sigils.BEGIN } as HtmlElement,
  CONT: { tag: 'sigil', text: sigils.CONT } as HtmlElement,
  END: { tag: 'sigil', text: sigils.END } as HtmlElement,
  RESET: { tag: 'sigil', text: sigils.RESET } as HtmlElement,
};

const t = (text: string): HtmlElement => ({ tag: 'text', text });

const processMaybeHtmlElements = (
  elements: MaybeHtmlElement | MaybeHtmlElement[] | undefined,
) => {
  if (Array.isArray(elements)) {
    return elements.filter((child): child is HtmlElement => Boolean(child));
  } else if (elements) {
    return [elements];
  }
};

const a = (
  link: LinkHtmlElement['link'],
  children: MaybeHtmlElement | MaybeHtmlElement[],
): HtmlElement => ({
  tag: 'link',
  link,
  children: processMaybeHtmlElements(children),
});

const s = (
  classes: SpanHtmlElement['classes'],
  children?: MaybeHtmlElement | MaybeHtmlElement[],
  tooltipText?: SpanHtmlElement['tooltipText'],
): HtmlElement => {
  return {
    tag: 'span',
    classes,
    children: processMaybeHtmlElements(children),
    tooltipText,
  };
};

export class HtmlifyVisitor extends visitorCommon.AstVisitor<HtmlifyResult> {
  constructor(
    readonly options: HtmlifyOptions,
    readonly registry: HtmlifyFileRegistry,
  ) {
    super(options);
  }

  private keywordElement(keyword: string): HtmlElement {
    return s([HtmlClass.KEYWORD], t(keyword));
  }

  private symbolElement(symbol: string): HtmlElement {
    return s([HtmlClass.SYMBOL], t(symbol));
  }

  private toSeparatedList(
    nodes: ReadonlyArray<astCommon.AstNode>,
    separator = s([HtmlClass.SYMBOL], t(this.symbols.listSeparator)),
    addSpace = true,
  ): HtmlifyResult {
    return nodes.flatMap((node, index, array) => {
      const htmlified = node.accept<HtmlifyResult, this>(this);
      if (astCommon.isLastIndex(index, array)) return htmlified;
      return addSpace
        ? htmlified.concat(separator, g.SP)
        : htmlified.concat(separator);
    });
  }

  private toParameterList(
    parameters: ReadonlyArray<astCommon.MaybeTypedIdentifier>,
    separator = s(
      [HtmlClass.SYMBOL],
      t(this.symbols.functionParameterSeparator),
    ),
  ): readonly [HtmlifyResult, boolean] {
    let hasAnnotation = false;

    const list = parameters.flatMap(({ identifier, suffix }, index, array) => {
      const htmlified: HtmlifyResult = [
        s(
          [HtmlClass.IDENTIFIER],
          t(identifier.name),
          `${identifier.name}${this.symbols.typeAnnotation} ${this.symbols.placeholder}`,
        ),
      ];

      if (suffix) {
        if (!hasAnnotation) hasAnnotation = true;
        htmlified.push(
          this.symbolElement(this.symbols.typeAnnotation),
          g.SP,
          ...suffix.accept<HtmlifyResult, this>(this),
        );
      }

      if (astCommon.isLastIndex(index, array)) return htmlified;
      return htmlified.concat(separator, g.SP);
    });

    return [list, hasAnnotation] as const;
  }

  private startsWithCapitalLetter(string: string): boolean {
    const firstLetter = string.charAt(0);
    return firstLetter !== firstLetter.toLowerCase();
  }

  visitBlankLineNode(_: astCommon.BlankLineNode): HtmlifyResult {
    return [];
  }

  visitCommentNode(node: astCommon.CommentNode): HtmlifyResult {
    return node.comment.split('\n').flatMap((line, index, array) => {
      const commentBegin = node.isDocComment
        ? this.symbols.docCommentBegin
        : this.symbols.commentBegin;
      return [
        s(
          [HtmlClass.COMMENT],
          t(line.length > 0 ? commentBegin + sigils.SP + line : commentBegin),
        ),
        index < array.length - 1 && g.NL,
      ];
    });
  }

  visitPlaceholderNode(_: astCommon.PlaceHolderNode): HtmlifyResult {
    return [this.keywordElement(this.symbols.placeholder)];
  }

  visitIdentifierNode(node: astCommon.IdentifierNode): HtmlifyResult {
    return [
      s(
        [HtmlClass.IDENTIFIER],
        t(node.name),
        `${node.name}${this.symbols.typeAnnotation} ${this.symbols.placeholder}`,
      ),
    ];
  }

  visitTypeIdentifierNode(node: astCommon.TypeIdentifierNode): HtmlifyResult {
    const typeOrGeneric = (ident: string) => {
      const htmlClass = this.startsWithCapitalLetter(ident)
        ? HtmlClass.TYPE
        : HtmlClass.GENERIC;
      return s([htmlClass], t(ident));
    };

    const htmlified: HtmlifyResult = [typeOrGeneric(node.name)];

    if (node.generics) {
      htmlified.push(
        this.symbolElement(this.symbols.genericsListBegin),
        ...node.generics.identifiers.flatMap((identifier, index, array) => {
          const htmlified = typeOrGeneric(identifier.name);
          if (astCommon.isLastIndex(index, array)) return htmlified;
          return [
            htmlified,
            this.symbolElement(this.symbols.genericsListSeparator),
            g.SP,
          ];
        }),
        this.symbolElement(this.symbols.genericsListEnd),
      );
    }

    return htmlified;
  }

  visitTypeNode({ child }: astCommon.TypeNode): HtmlifyResult {
    if (child instanceof astCommon.PathNode) {
      const { components } = child;
      return components.flatMap((component, index, array) => {
        if (astCommon.isLastIndex(index, array))
          return [s([HtmlClass.TYPE], t(component.name))];
        return [
          s([HtmlClass.MODULE], t(component.name)),
          this.symbolElement(this.symbols.pathSeparator),
        ];
      });
    } else {
      return child.accept<HtmlifyResult, this>(this);
    }
  }

  visitPathNode(node: astCommon.PathNode): HtmlifyResult {
    return node.components.flatMap((component, index, array) => {
      const htmlified = [
        s(
          [HtmlClass.MODULE],
          t(
            this.options.uppercaseModules
              ? astCommon.capitalizeModuleName(component.name)
              : component.name,
          ),
        ),
      ];
      if (astCommon.isLastIndex(index, array)) return htmlified;
      return htmlified.concat(this.symbolElement(this.symbols.pathSeparator));
    });
  }

  visitAnonymousConstructorNode(
    node: astCommon.AnonymousConstructorNode,
  ): HtmlifyResult {
    return new ConstructorDeclaration(
      astCommon.ident(this.symbols.anonymousConstructorTag),
      node.fields,
    ).accept(this);
  }

  visitGenericsListNode(node: astCommon.GenericsListNode): HtmlifyResult {
    return [
      this.symbolElement(this.symbols.genericsListBegin),
      ...this.toSeparatedList(
        node.identifiers,
        this.symbolElement(this.symbols.genericsListSeparator),
      ),
      this.symbolElement(this.symbols.genericsListEnd),
    ];
  }

  visitImportDeclaration(decl: ImportDeclaration): HtmlifyResult {
    const importContents: HtmlifyResult = [
      this.keywordElement(this.keywords.import),
      g.SP,
    ];

    let link: string;
    const expectedFileName = decl.path.components
      .map((component) =>
        this.options.uppercaseModules
          ? astCommon.capitalizeModuleName(component.name)
          : component.name,
      )
      .join('-');

    if (this.registry.includes(expectedFileName)) {
      link = './' + expectedFileName + `.${FILE_EXTENSION}.html`;
    } else {
      link = '#';
    }

    if (this.options.stringImports) {
      importContents.push(
        s(
          [HtmlClass.STRING],
          [
            t(this.symbols.stringBegin),
            a(link, [
              Boolean(decl.external) && t(this.symbols.importExternal),
              ...decl.path.components.flatMap((component, index, array) => {
                const isLastComponent = astCommon.isLastIndex(index, array);
                const htmlified = t(
                  isLastComponent && this.options.uppercaseModules
                    ? astCommon.capitalizeModuleName(component.name)
                    : component.name,
                );
                if (isLastComponent) return htmlified;
                return [htmlified, t('/')];
              }),
              Boolean(this.options.importWithFileExtension) &&
                t(`.${FILE_EXTENSION}`),
            ]),
            t(this.symbols.stringEnd),
          ],
        ),
      );
    } else {
      if (decl.external) {
        importContents.push(this.keywordElement('library'), g.SP);
      }

      importContents.push(
        ...decl.path.components.flatMap((component, index, array) => {
          const htmlified = [
            s(
              [HtmlClass.MODULE],
              a(
                link,
                t(
                  this.options.uppercaseModules
                    ? astCommon.capitalizeModuleName(component.name)
                    : component.name,
                ),
              ),
            ),
          ];
          if (astCommon.isLastIndex(index, array)) return htmlified;
          return htmlified.concat(t(this.symbols.pathSeparator));
        }),
      );
    }

    if (decl.rename) {
      importContents.push(
        g.SP,
        this.keywordElement(this.keywords.importRename),
        g.SP,
        s([HtmlClass.MODULE], t(decl.rename)),
      );
    }

    if (decl.exposedIdentifiers) {
      importContents.push(
        g.SP,
        this.keywordElement(this.keywords.importExposing),
        g.SP,
        ...decl.exposedIdentifiers.flatMap((exposed, index, array) => {
          const htmlClass = this.startsWithCapitalLetter(exposed.identifier)
            ? HtmlClass.CONSTRUCTOR
            : HtmlClass.FUNCTION;

          const stringified: HtmlifyResult = [
            s([htmlClass], t(exposed.identifier)),
          ];

          if (exposed.rename) {
            stringified.push(
              g.SP,
              this.keywordElement(this.keywords.importRename),
              g.SP,
              s([htmlClass], t(exposed.rename)),
            );
          }

          if (astCommon.isLastIndex(index, array)) return stringified;
          return stringified.concat(
            this.symbolElement(this.symbols.importExposedIdentifiersSeparator),
            g.SP,
          );
        }),
      );
    }

    return importContents;
  }

  visitImportDeclarationGroup(decl: ImportDeclarationGroup): HtmlifyResult {
    return this.toSeparatedList(decl.imports, g.NL, false);
  }

  visitBindingDeclaration(decl: BindingDeclaration): HtmlifyResult {
    return [
      this.keywordElement(this.keywords.bindingImmutable),
      g.SP,
      ...decl.identifier.accept<HtmlifyResult, this>(this),
      ...(decl.identifierType
        ? [
            this.symbolElement(this.symbols.typeAnnotation),
            g.SP,
            ...decl.identifierType.accept<HtmlifyResult, this>(this),
          ]
        : []),
      g.SP,
      s([HtmlClass.OPERATOR], t(this.symbols.bindingOperator)),
      g.SP,
      ...decl.value.accept<HtmlifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): HtmlifyResult {
    return [
      this.keywordElement(this.keywords.function),
      g.SP,
      s([HtmlClass.FUNCTION], t(decl.identifier.name)),
      this.symbolElement(this.symbols.functionInvokeBegin),
      ...this.toParameterList(decl.parameters)[0],
      this.symbolElement(this.symbols.functionInvokeEnd),
      g.SP,
      ...(decl.returnType
        ? [
            t(this.symbols.functionReturn),
            g.SP,
            ...decl.returnType.accept<HtmlifyResult, this>(this),
            g.SP,
          ]
        : []),
      this.symbolElement(this.symbols.functionBegin),
      !(decl.body instanceof BlockExpression) && g.SP,
      ...decl.body.accept<HtmlifyResult, this>(this),
    ];
  }

  visitConstructorDeclaration(decl: ConstructorDeclaration): HtmlifyResult {
    const htmlified: HtmlifyResult = [
      s([HtmlClass.CONSTRUCTOR], t(decl.identifier.name)),
    ];

    if (decl.parameters.length > 0) {
      htmlified.push(
        this.symbolElement(this.symbols.constructorInvokeBegin),
        ...decl.parameters.flatMap(({ identifier, suffix }, index, array) => {
          const htmlified: HtmlifyResult = [
            s(
              [HtmlClass.CONSTRUCTOR],
              t(identifier.name),
              `${identifier.name}${this.symbols.typeAnnotation} ${this.symbols.placeholder}`,
            ),
            this.symbolElement(this.symbols.typeAnnotation),
            g.SP,
            ...suffix.accept<HtmlifyResult, this>(this),
          ];

          if (astCommon.isLastIndex(index, array)) return htmlified;
          return htmlified.concat(
            this.symbolElement(this.symbols.constructorParameterSeparator),
            g.SP,
          );
        }),
        this.symbolElement(this.symbols.constructorInvokeEnd),
      );
    }

    return htmlified;
  }

  visitSumTypeDeclaration(decl: SumTypeDeclaration): HtmlifyResult {
    return [
      this.keywordElement(this.keywords.type),
      g.SP,
      ...decl.identifier.accept<HtmlifyResult, this>(this),
      g.SP,
      this.symbolElement(this.symbols.typeBegin),
      g.BEGIN,
      this.symbolElement(this.symbols.constructorDeclarationBegin),
      g.SP,
      ...new ConstructorDeclaration(
        astCommon.ident(decl.identifier.name),
        decl.fields,
      ).accept<HtmlifyResult, this>(this),
      g.END,
    ];
  }

  visitProductTypeDeclaration(decl: ProductTypeDeclaration): HtmlifyResult {
    return [
      this.keywordElement(this.keywords.type),
      g.SP,
      ...decl.identifier.accept<HtmlifyResult, this>(this),
      g.SP,
      this.symbolElement(this.symbols.typeBegin),
      g.BEGIN,
      ...decl.constructors.flatMap((constructor, index, array) => [
        this.symbolElement(this.symbols.constructorDeclarationBegin),
        g.SP,
        ...constructor.accept<HtmlifyResult, this>(this),
        index < array.length - 1 && g.CONT,
      ]),
      g.END,
    ];
  }

  visitTypeAliasDeclaration(decl: TypeAliasDeclaration): HtmlifyResult {
    return [
      this.keywordElement(this.keywords.typeAlias),
      g.SP,
      ...decl.identifier.accept<HtmlifyResult, this>(this),
      g.SP,
      this.symbolElement(this.symbols.typeBegin),
      g.SP,
      ...decl.type.accept<HtmlifyResult, this>(this),
    ];
  }

  visitLiteralExpression(expr: LiteralExpression): HtmlifyResult {
    switch (expr.literal.kind) {
      case 'boolean':
        return [
          s([HtmlClass.CONSTRUCTOR], t(expr.literal.value ? 'True' : 'False')),
        ];
      case 'integer':
        return [s([HtmlClass.NUMBER], t(expr.literal.value.toString()))];
      case 'float': {
        const stringValue = expr.literal.value.toString();
        return [
          s(
            [HtmlClass.NUMBER],
            t(
              stringValue.includes('.')
                ? stringValue
                : expr.literal.value.toFixed(1),
            ),
          ),
        ];
      }
      case 'string':
      default:
        return [
          s(
            [HtmlClass.STRING],
            t(
              this.symbols.stringBegin +
                expr.literal.value +
                this.symbols.stringEnd,
            ),
          ),
        ];
    }
  }

  visitInterpolatedStringExpression(
    expr: InterpolatedStringExpression,
  ): HtmlifyResult {
    return expr.components.flatMap((component, index, array) => {
      if (typeof component === 'string') {
        const strings: string[] = [];
        if (index === 0) strings.push(this.symbols.stringBegin);
        strings.push(component);
        if (astCommon.isLastIndex(index, array))
          strings.push(this.symbols.stringEnd);
        return s([HtmlClass.STRING], t(strings.join('')));
      } else {
        return [
          this.keywordElement(this.symbols.stringInterpolationBegin),
          ...component.accept<HtmlifyResult, this>(this),
          this.keywordElement(this.symbols.stringInterpolationEnd),
          astCommon.isLastIndex(index, array) &&
            s([HtmlClass.STRING], t(this.symbols.stringEnd)),
        ];
      }
    });
  }

  visitTupleExpression(expr: TupleExpression): HtmlifyResult {
    return [
      this.symbolElement(this.symbols.tupleBegin),
      ...this.toSeparatedList(
        expr.contents,
        this.symbolElement(this.symbols.tupleSeparator),
      ),
      this.symbolElement(this.symbols.tupleEnd),
    ];
  }

  visitListExpression(expr: ListExpression): HtmlifyResult {
    return [
      this.symbolElement(this.symbols.listBegin),
      ...this.toSeparatedList(expr.contents),
      this.symbolElement(this.symbols.listEnd),
    ];
  }

  visitCallExpression(expr: CallExpression): HtmlifyResult {
    const htmlified: HtmlifyResult = [];

    if (expr.function_ instanceof astCommon.IdentifierNode) {
      htmlified.push(s([HtmlClass.FUNCTION], t(expr.function_.name)));
    } else {
      const components = expr.function_.components;
      const allButLast = components.slice(0, -1);
      const lastComponent = components.at(-1);

      htmlified.push(
        ...new astCommon.PathNode(allButLast).accept<HtmlifyResult, this>(this),
      );

      if (lastComponent) {
        htmlified.push(
          this.symbolElement(this.symbols.pathSeparator),
          s([HtmlClass.FUNCTION], t(lastComponent.name)),
        );
      }
    }

    if (expr.arguments_) {
      htmlified.push(
        this.symbolElement(this.symbols.functionInvokeBegin),
        ...this.toSeparatedList(
          expr.arguments_,
          this.symbolElement(this.symbols.functionParameterSeparator),
        ),
        this.symbolElement(this.symbols.functionInvokeEnd),
      );
    }

    return htmlified;
  }

  visitConstructorExpression(expr: ConstructorExpression): HtmlifyResult {
    const htmlified: HtmlifyResult = [];
    const { identifier: givenIdentifier } = expr;

    if (givenIdentifier instanceof astCommon.IdentifierNode) {
      htmlified.push(s([HtmlClass.CONSTRUCTOR], t(givenIdentifier.name)));
    } else {
      givenIdentifier.components.forEach((component, index, array) => {
        if (astCommon.isLastIndex(index, array)) {
          htmlified.push(s([HtmlClass.CONSTRUCTOR], t(component.name)));
        } else {
          const componentName = this.options.uppercaseModules
            ? astCommon.capitalizeModuleName(component.name)
            : component.name;
          htmlified.push(
            s([HtmlClass.MODULE], t(componentName)),
            this.symbolElement(this.symbols.pathSeparator),
          );
        }
      });
    }

    if (expr.arguments_.length > 0) {
      htmlified.push(
        this.symbolElement(this.symbols.functionInvokeBegin),
        ...expr.arguments_.flatMap((argument, index, array) => {
          const htmlified = [
            ...(argument.identifier
              ? [
                  s([HtmlClass.CONSTRUCTOR], t(argument.identifier.name)),
                  this.symbolElement(this.symbols.labelledParameterAnnotation),
                  g.SP,
                ]
              : []),
            ...argument.suffix.accept<HtmlifyResult, this>(this),
          ];
          if (astCommon.isLastIndex(index, array)) return htmlified;
          return htmlified.concat(
            this.symbolElement(this.symbols.functionParameterSeparator),
            g.SP,
          );
        }),
        this.symbolElement(this.symbols.functionInvokeEnd),
      );
    }

    return htmlified;
  }

  visitDotExpression(expr: DotExpression): HtmlifyResult {
    return expr.components.flatMap((component, index, array) => {
      const htmlified: HtmlifyResult = [];

      if (typeof component === 'string') {
        htmlified.push(s([HtmlClass.IDENTIFIER], t(component)));
      } else {
        htmlified.push(...component.accept<HtmlifyResult, this>(this));
      }

      if (index < array.length - 1) {
        htmlified.push(this.symbolElement(this.symbols.recordPathSeparator));
      }

      return htmlified;
    });
  }

  visitUnaryExpression(expr: UnaryExpression): HtmlifyResult {
    return [
      this.symbolElement(expr.operator),
      ...expr.expression.accept<HtmlifyResult, this>(this),
    ];
  }

  visitBinaryExpression(expr: BinaryExpression): HtmlifyResult {
    return [
      ...expr.lhs.accept<HtmlifyResult, this>(this),
      g.SP,
      this.symbolElement(expr.operator),
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
      this.keywordElement(this.keywords.lambda),
      hasAnnotation && this.symbolElement(this.symbols.functionInvokeBegin),
      ...paramList,
      // hasAnnotation && s([HtmlClass.SYMBOL], t(this.symbols.functionInvokeEnd)),
      hasAnnotation && this.symbolElement(this.symbols.functionInvokeEnd),
      g.SP,
      this.symbolElement(this.symbols.lambdaBegin),
      g.SP,
      ...expr.body.accept<HtmlifyResult, this>(this),
    ];
  }

  visitIfExpression(expr: IfExpression): HtmlifyResult {
    const isConditionBlockExpr = expr.condition instanceof BlockExpression;
    const isThenBodyBlockExpr = expr.thenBody instanceof BlockExpression;
    const isElseBodyBlockExpr = expr.elseBody instanceof BlockExpression;

    const htmlified: HtmlifyResult = [
      this.keywordElement(this.keywords.ifBegin),
      !isConditionBlockExpr && g.SP,
      ...expr.condition.accept<HtmlifyResult, this>(this),
      !isConditionBlockExpr && g.SP,
      this.keywordElement(this.keywords.ifThen),
      !isThenBodyBlockExpr && g.SP,
      ...expr.thenBody.accept<HtmlifyResult, this>(this),
    ];

    if (expr.elseBody) {
      htmlified.push(
        !isThenBodyBlockExpr ? g.SP : g.CONT,
        this.keywordElement(this.keywords.ifElse),
        !isElseBodyBlockExpr && g.SP,
        ...expr.elseBody.accept<HtmlifyResult, this>(this),
      );
    }

    return htmlified;
  }

  visitCaseExpression(expr: CaseExpression): HtmlifyResult {
    const isPredicateBlockExpr = expr.predicate instanceof BlockExpression;

    const htmlified: HtmlifyResult = [
      this.keywordElement(this.keywords.caseBegin),
      !isPredicateBlockExpr && g.SP,
      ...expr.predicate.accept<HtmlifyResult, this>(this),
      !isPredicateBlockExpr && g.SP,
      this.keywordElement(this.keywords.caseOf),
    ];

    if (expr.branches.length > 0) {
      htmlified.push(
        g.BEGIN,
        ...expr.branches.flatMap(([pattern, expression], index, array) => {
          const isExpressionBlockExpr = expression instanceof BlockExpression;
          const htmlified: HtmlifyResult = [
            ...pattern.accept<HtmlifyResult, this>(this),
            g.SP,
            this.keywordElement(this.keywords.caseBranchBegin),
            !isExpressionBlockExpr && g.SP,
            ...expression.accept<HtmlifyResult, this>(this),
          ];

          if (astCommon.isLastIndex(index, array)) return htmlified;
          return htmlified.concat(g.CONT);
        }),
        g.END,
      );
    } else {
      htmlified.push(
        g.BEGIN,
        ...astCommon.placeholder().accept<HtmlifyResult, this>(this),
        g.SP,
        this.keywordElement(this.keywords.caseBranchBegin),
        g.SP,
        ...astCommon.placeholder().accept<HtmlifyResult, this>(this),
        g.END,
      );
    }

    return htmlified;
  }
}

// -----------------------------------------------------------------------------

type HtmlifiedModuleDictionary<K extends string> = Record<K, string>;
type HtmlifyFileRegistry = string[];

// deno-lint-ignore no-empty-interface
interface HtmlifyOptions extends visitorCommon.AstVisitorOptions {}

export function htmlify<K extends string = string>(
  modules: Record<K, astCommon.Module>,
  options: HtmlifyOptions = {},
): HtmlifiedModuleDictionary<K> {
  const registry = Object.keys(modules);
  return Object.entries<astCommon.Module>(modules).reduce<
    HtmlifiedModuleDictionary<K>
  >((acc, curr) => {
    acc[curr[0] as K] = htmlifyModule(curr[0], curr[1], options, registry);
    return acc;
  }, {} as HtmlifiedModuleDictionary<K>);
}

function htmlifyModule(
  moduleName: string,
  module: astCommon.Module,
  options: HtmlifyOptions,
  registry: HtmlifyFileRegistry,
): string {
  let processedModule: astCommon.Module;

  if (options.stripComments) {
    processedModule = module.filter(
      (item) => !(item instanceof astCommon.CommentNode),
    );
  } else {
    processedModule = module;
  }

  const table = processedModule
    .flatMap((node) => processNode(node, options, registry).concat(sigils.NL))
    .join('')
    .trim()
    .split('\n')
    .concat('\n')
    .map((line, index) => {
      const lineNumber = index + 1;
      const isLineEmpty = line.replaceAll('&nbsp;', ' ').trim().length === 0;
      const lineContent = isLineEmpty ? '&NewLine;' : line;
      return [
        `<tr>`,
        `<td id="L${lineNumber}" class="blob number" data-line-number="${lineNumber}"></td>`,
        `<td class="blob line">${lineContent}</td>`,
        `</tr>`,
      ].join('');
    })
    .join('');

  return [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head><meta charset="UTF-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${moduleName}.hl</title><link rel="stylesheet" href="lang.css" /><link rel="apple-touch-icon" href="favicon.png" /><link rel="icon" type="image/x-icon" sizes="32x32" href="favicon.ico" /></head>`,
    `<body>`,
    `<table><tbody>`,
    table,
    `</tbody></table>`,
    `</body>`,
    `</html>`,
  ].join('');
}

function processNode(
  node: astCommon.TopLevelNode,
  options: HtmlifyOptions,
  registry: HtmlifyFileRegistry,
) {
  const visitor = new HtmlifyVisitor(options, registry);
  const tokens = node
    .accept<HtmlifyResult, typeof visitor>(visitor)
    .filter((token): token is HtmlElement => Boolean(token));

  return htmlElementsToStrings(tokens, options.indentationCount ?? 2);
}

function htmlElementsToStrings(
  elements: HtmlElement[],
  indentationCount: number,
) {
  let currIndent = 0;
  const processed: string[] = [];
  const htmlElements = Array.isArray(elements) ? elements : [elements];

  function visitHtmlElement(element: HtmlElement) {
    switch (element.tag) {
      case 'sigil': {
        if (element === g.SP) {
          processed.push('&nbsp;');
          return;
        }

        if (element === g.NL) {
          processed.push(sigils.NL);
        } else if (element === g.BEGIN) {
          currIndent += indentationCount;
          processed.push(sigils.NL, indent(currIndent));
        } else if (element === g.CONT) {
          processed.push(sigils.NL, indent(currIndent));
        } else if (element === g.END) {
          // We won't do anything special with END tokens other than
          // decrementing the current indentation level
          currIndent = Math.max(0, currIndent - indentationCount);
        } else if (element === g.RESET) {
          currIndent = 0;
          processed.push(sigils.NL, indent(currIndent));
        } else {
          return;
        }

        break;
      }
      case 'span': {
        /* if (element.tooltipText) {
          const classes = element.classes.join(' ');
          const tooltipText = element.tooltipText;
          processed.push(
            `<span class="${classes} tooltip" data-tooltip-text="${tooltipText}">`,
          );
        } else */ {
          processed.push(`<span class="${element.classes.join(' ')}">`);
        }
        if (element.children) {
          if (Array.isArray(element.children)) {
            element.children.forEach(visitHtmlElement);
          } else {
            visitHtmlElement(element.children);
          }
        }
        processed.push(`</span>`);
        break;
      }
      case 'link': {
        processed.push(`<a href="${element.link}">`);
        if (element.children) {
          if (Array.isArray(element.children)) {
            element.children.forEach(visitHtmlElement);
          } else {
            visitHtmlElement(element.children);
          }
        }
        processed.push(`</a>`);
        break;
      }
      case 'text': /* FALLTHROUGH */
      default:
        processed.push(escapeHtml(element.text).replaceAll(' ', '&nbsp;'));
        break;
    }
  }

  for (const element of htmlElements) {
    visitHtmlElement(element);
  }

  return processed;
}

function indent(times: number) {
  return '&nbsp;'.repeat(Math.max(0, times));
}
