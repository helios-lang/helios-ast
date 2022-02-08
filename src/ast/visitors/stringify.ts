import { AstVisitor, AstVisitorOptions } from './common.ts';

import * as ast from '../common.ts';
import * as sigils from '../sigils.ts';
import * as utils from '../utils.ts';
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

export type StringifyResult = (string | false)[];

export class StringifyVisitor extends AstVisitor<StringifyResult> {
  private toSeparatedList(
    nodes: ReadonlyArray<ast.AstNode>,
    separator = this.symbols.listSeparator,
    addSpace = true,
  ): StringifyResult {
    return nodes.flatMap((node, index, array) => {
      const stringified = node.accept<StringifyResult, this>(this);
      if (utils.isLastIndex(index, array)) return stringified;
      return addSpace
        ? stringified.concat(separator, sigils.SP)
        : stringified.concat(separator);
    });
  }

  private toParameterList(
    parameters: ReadonlyArray<ast.MaybeTypedIdentifier>,
    separator = this.symbols.functionParameterSeparator,
  ): StringifyResult {
    return parameters.flatMap(({ identifier, suffix }, index, array) => {
      const stringified = identifier.accept<StringifyResult, this>(this);

      if (suffix) {
        stringified.push(
          this.symbols.typeAnnotation,
          sigils.SP,
          ...suffix.accept<StringifyResult, this>(this),
        );
      }

      if (utils.isLastIndex(index, array)) return stringified;
      return stringified.concat(separator, sigils.SP);
    });
  }

  visitBlankLineNode(_: ast.BlankLineNode): StringifyResult {
    return [];
  }

  visitCommentNode(node: ast.CommentNode): StringifyResult {
    return node.comment.split('\n').flatMap((content, index, array) => {
      const commentBegin = node.isDocComment
        ? this.symbols.docCommentBegin
        : this.symbols.commentBegin;
      return [
        commentBegin,
        content.length > 0 && sigils.SP + content,
        index < array.length - 1 && sigils.NL,
      ];
    });
  }

  visitPlaceholderNode(_: ast.PlaceHolderNode): StringifyResult {
    return [this.symbols.placeholder];
  }

  visitIdentifierNode(node: ast.IdentifierNode): StringifyResult {
    return [node.name];
  }

  visitTypeIdentifierNode(node: ast.TypeIdentifierNode): StringifyResult {
    const stringified: StringifyResult = [node.name];

    if (node.generics) {
      stringified.push(
        this.symbols.genericsListBegin,
        ...this.toSeparatedList(
          node.generics.identifiers,
          this.symbols.genericsListSeparator,
        ),
        this.symbols.genericsListEnd,
      );
    }

    return stringified;
  }

  visitTypeNode(node: ast.TypeNode): StringifyResult {
    return node.child.accept(this);
  }

  visitPathNode(node: ast.PathNode): StringifyResult {
    return node.components.flatMap((component, index, array) => {
      const stringified: StringifyResult = [
        this.options.uppercaseModules
          ? utils.capitalizeModuleName(component.name)
          : component.name,
      ];
      if (utils.isLastIndex(index, array)) return stringified;
      return stringified.concat(this.symbols.pathSeparator);
    });
  }

  visitAnonymousConstructorNode(
    node: ast.AnonymousConstructorNode,
  ): StringifyResult {
    return [
      this.symbols.anonymousConstructorTag,
      this.symbols.anonymousConstructorInvokeBegin,
      ...this.toParameterList(
        node.fields,
        this.symbols.anonymousConstructorSeparator,
      ),
      this.symbols.anonymousConstructorInvokeEnd,
    ];
  }

  visitGenericsListNode(node: ast.GenericsListNode): StringifyResult {
    return [
      this.symbols.genericsListBegin,
      ...this.toSeparatedList(
        node.identifiers,
        this.symbols.genericsListSeparator,
      ),
      this.symbols.genericsListEnd,
    ];
  }

  visitExportedDeclarationNode(
    node: ast.ExportedDeclarationNode,
  ): StringifyResult {
    return [
      this.keywords.export,
      ...(node.rename
        ? [sigils.SP, this.keywords.exportAs, sigils.SP, node.rename]
        : []),
      sigils.SP,
      ...node.declaration.accept<StringifyResult, this>(this),
    ];
  }

  visitImportDeclaration(decl: ImportDeclaration): StringifyResult {
    const importContents: StringifyResult = [this.keywords.import, sigils.SP];

    if (this.options.stringImports) {
      importContents.push(
        this.symbols.stringBegin,
        Boolean(decl.external) && this.symbols.importExternal,
        ...decl.path.components.flatMap((component, index, array) => {
          const isLastComponent = utils.isLastIndex(index, array);
          const stringified =
            isLastComponent && this.options.uppercaseModules
              ? utils.capitalizeModuleName(component.name)
              : component.name;
          if (isLastComponent) return stringified;
          return [stringified, '/'];
        }),
        Boolean(this.options.importWithFileExtension) && `.${FILE_EXTENSION}`,
        this.symbols.stringEnd,
      );
    } else {
      if (decl.external) importContents.push('library', sigils.SP);
      importContents.push(
        ...decl.path.components.flatMap((component, index, array) => {
          const stringified = [
            this.options.uppercaseModules
              ? utils.capitalizeModuleName(component.name)
              : component.name,
          ];

          if (utils.isLastIndex(index, array)) return stringified;
          return stringified.concat(this.symbols.pathSeparator);
        }),
      );
    }

    if (decl.rename) {
      importContents.push(
        sigils.SP,
        this.keywords.importRename,
        sigils.SP,
        decl.rename,
      );
    }

    if (decl.exposedIdentifiers) {
      importContents.push(
        sigils.SP,
        this.keywords.importExposing,
        sigils.SP,
        ...decl.exposedIdentifiers.flatMap((exposed, index, array) => {
          const stringified: StringifyResult = [exposed.identifier];

          if (exposed.rename) {
            stringified.push(
              sigils.SP,
              this.keywords.importRename,
              sigils.SP,
              exposed.rename,
            );
          }

          if (utils.isLastIndex(index, array)) return stringified;
          return stringified.concat(
            this.symbols.importExposedIdentifiersSeparator,
            sigils.SP,
          );
        }),
      );
    }

    return importContents;
  }

  visitImportDeclarationGroup(decl: ImportDeclarationGroup): StringifyResult {
    return this.toSeparatedList(decl.imports, sigils.NL, false);
  }

  visitBindingDeclaration(decl: BindingDeclaration): StringifyResult {
    return [
      this.keywords.bindingImmutable,
      sigils.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      ...(decl.identifierType
        ? [
            this.symbols.typeAnnotation,
            sigils.SP,
            ...decl.identifierType.accept<StringifyResult, this>(this),
          ]
        : []),
      sigils.SP,
      this.symbols.bindingOperator,
      sigils.SP,
      ...decl.value.accept<StringifyResult, this>(this),
    ];
  }

  visitFunctionDeclaration(decl: FunctionDeclaration): StringifyResult {
    return [
      this.keywords.function,
      sigils.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      this.symbols.functionInvokeBegin,
      ...this.toParameterList(decl.parameters),
      this.symbols.functionInvokeEnd,
      sigils.SP,
      ...(decl.returnType
        ? [
            this.symbols.functionReturn,
            sigils.SP,
            ...decl.returnType.accept<StringifyResult, this>(this),
            sigils.SP,
          ]
        : []),
      this.symbols.functionBegin,
      !(decl.body instanceof BlockExpression) && sigils.SP,
      ...decl.body.accept<StringifyResult, this>(this),
    ];
  }

  visitConstructorDeclaration(decl: ConstructorDeclaration): StringifyResult {
    const stringified: StringifyResult = decl.identifier.accept<
      StringifyResult,
      this
    >(this);

    if (decl.parameters.length > 0) {
      stringified.push(
        this.symbols.constructorInvokeBegin,
        ...this.toParameterList(
          decl.parameters,
          this.symbols.constructorParameterSeparator,
        ),
        this.symbols.constructorInvokeEnd,
      );
    }

    return stringified;
  }

  visitSumTypeDeclaration(decl: SumTypeDeclaration): StringifyResult {
    return [
      this.keywords.type,
      sigils.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      sigils.SP,
      this.symbols.typeBegin,
      sigils.BEGIN,
      this.symbols.constructorDeclarationBegin,
      sigils.SP,
      ...new ConstructorDeclaration(
        ast.ident(decl.identifier.name),
        decl.fields,
      ).accept<StringifyResult, this>(this),
      sigils.END,
    ];
  }

  visitProductTypeDeclaration(decl: ProductTypeDeclaration): StringifyResult {
    return [
      this.keywords.type,
      sigils.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      sigils.SP,
      this.symbols.typeBegin,
      sigils.BEGIN,
      ...decl.constructors.flatMap((constructor, index, array) => [
        this.symbols.constructorDeclarationBegin,
        sigils.SP,
        ...constructor.accept<StringifyResult, this>(this),
        index < array.length - 1 && sigils.CONT,
      ]),
      sigils.END,
    ];
  }

  visitTypeAliasDeclaration(decl: TypeAliasDeclaration): StringifyResult {
    return [
      this.keywords.typeAlias,
      sigils.SP,
      ...decl.identifier.accept<StringifyResult, this>(this),
      sigils.SP,
      this.symbols.typeBegin,
      sigils.SP,
      ...decl.type.accept<StringifyResult, this>(this),
    ];
  }

  visitLiteralExpression(expr: LiteralExpression): StringifyResult {
    switch (expr.literal.kind) {
      case 'boolean':
        return [expr.literal.value ? 'True' : 'False'];
      case 'integer':
        return [String(expr.literal.value)];
      case 'float': {
        const stringValue = expr.literal.value.toString();
        return [
          stringValue.includes('.')
            ? stringValue
            : expr.literal.value.toFixed(1),
        ];
      }
      default:
        return [
          this.symbols.stringBegin,
          String(expr.literal.value),
          this.symbols.stringEnd,
        ];
    }
  }

  visitInterpolatedStringExpression(
    expr: InterpolatedStringExpression,
  ): StringifyResult {
    const stringified: StringifyResult = [this.symbols.stringBegin];

    for (const component of expr.components) {
      if (typeof component === 'string') {
        stringified.push(component);
      } else {
        stringified.push(
          this.symbols.stringInterpolationBegin,
          ...component.accept<StringifyResult, this>(this),
          this.symbols.stringInterpolationEnd,
        );
      }
    }

    stringified.push(this.symbols.stringEnd);
    return stringified;
  }

  visitTupleExpression(expr: TupleExpression): StringifyResult {
    return [
      this.symbols.tupleBegin,
      ...this.toSeparatedList(expr.contents, this.symbols.tupleSeparator),
      this.symbols.tupleEnd,
    ];
  }

  visitListExpression(expr: ListExpression): StringifyResult {
    return [
      this.symbols.listBegin,
      ...this.toSeparatedList(expr.contents),
      this.symbols.listEnd,
    ];
  }

  visitCallExpression(expr: CallExpression): StringifyResult {
    const stringified: StringifyResult = [];

    if (expr.function_ instanceof ast.IdentifierNode) {
      stringified.push(expr.function_.name);
    } else {
      const components = expr.function_.components;
      const allButLast = components.slice(0, -1);
      const last = components.at(-1);

      stringified.push(
        ...new ast.PathNode(allButLast).accept<StringifyResult, this>(this),
      );

      if (last) {
        stringified.push(this.symbols.pathSeparator, last.name);
      }
    }

    if (expr.arguments_) {
      stringified.push(
        this.symbols.functionInvokeBegin,
        ...this.toSeparatedList(
          expr.arguments_,
          this.symbols.functionParameterSeparator,
        ),
        this.symbols.functionInvokeEnd,
      );
    }

    return stringified;
  }

  visitConstructorExpression(expr: ConstructorExpression): StringifyResult {
    const stringified: StringifyResult = [];
    const { identifier: givenIdentifier } = expr;

    if (givenIdentifier instanceof ast.IdentifierNode) {
      stringified.push(givenIdentifier.name);
    } else {
      givenIdentifier.components.forEach((component, index, array) => {
        if (utils.isLastIndex(index, array)) {
          stringified.push(component.name);
        } else {
          const componentName = this.options.uppercaseModules
            ? utils.capitalizeModuleName(component.name)
            : component.name;
          stringified.push(componentName, this.symbols.pathSeparator);
        }
      });
    }

    if (expr.arguments_.length > 0) {
      stringified.push(
        this.symbols.functionInvokeBegin,
        ...expr.arguments_.flatMap((argument, index, array) => {
          const stringified: StringifyResult = [
            ...(argument.identifier
              ? [
                  argument.identifier.name,
                  this.symbols.labelledParameterAnnotation,
                  sigils.SP,
                ]
              : []),
            ...argument.suffix.accept<StringifyResult, this>(this),
          ];
          if (utils.isLastIndex(index, array)) return stringified;
          return stringified.concat(
            this.symbols.functionParameterSeparator,
            sigils.SP,
          );
        }),
        this.symbols.functionInvokeEnd,
      );
    }

    return stringified;
  }

  visitDotExpression(expr: DotExpression): StringifyResult {
    return expr.components.flatMap((component, index, array) => {
      const stringified =
        typeof component === 'string'
          ? component
          : component.accept<StringifyResult, this>(this);
      if (utils.isLastIndex(index, array)) return stringified;
      return stringified.concat(this.symbols.recordPathSeparator);
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
      sigils.SP,
      expr.operator,
      sigils.SP,
      ...expr.rhs.accept<StringifyResult, this>(this),
    ];
  }

  visitBlockExpression(expr: BlockExpression): StringifyResult {
    return [
      sigils.BEGIN,
      ...this.toSeparatedList(expr.items, sigils.CONT, false),
      sigils.END,
    ];
  }

  visitLambdaExpression(expr: LambdaExpression): StringifyResult {
    return [
      this.keywords.lambda,
      ...this.toParameterList(expr.parameters),
      sigils.SP,
      this.symbols.lambdaBegin,
      sigils.SP,
      ...expr.body.accept<StringifyResult, this>(this),
    ];
  }

  visitIfExpression(expr: IfExpression): StringifyResult {
    const isConditionBlockExpr = expr.condition instanceof BlockExpression;
    const isThenBodyBlockExpr = expr.thenBody instanceof BlockExpression;
    const isElseBodyBlockExpr = expr.elseBody instanceof BlockExpression;

    const stringified: StringifyResult = [
      this.keywords.ifBegin,
      !isConditionBlockExpr && sigils.SP,
      ...expr.condition.accept<StringifyResult, this>(this),
      !isConditionBlockExpr && sigils.SP,
      this.keywords.ifThen,
      !isThenBodyBlockExpr && sigils.SP,
      ...expr.thenBody.accept<StringifyResult, this>(this),
    ];

    if (expr.elseBody) {
      stringified.push(
        !isThenBodyBlockExpr ? sigils.SP : sigils.CONT,
        this.keywords.ifElse,
        !isElseBodyBlockExpr && sigils.SP,
        ...expr.elseBody.accept<StringifyResult, this>(this),
      );
    }

    return stringified;
  }

  visitCaseExpression(expr: CaseExpression): StringifyResult {
    const isPredicateBlockExpr = expr.predicate instanceof BlockExpression;

    const stringified: StringifyResult = [
      this.keywords.caseBegin,
      !isPredicateBlockExpr && sigils.SP,
      ...expr.predicate.accept<StringifyResult, this>(this),
      !isPredicateBlockExpr && sigils.SP,
      this.keywords.caseOf,
    ];

    if (expr.branches.length > 0) {
      stringified.push(
        sigils.BEGIN,
        ...expr.branches.flatMap(([pattern, expression], index, array) => {
          const isExpressionBlockExpr = expression instanceof BlockExpression;
          const stringified: StringifyResult = [
            ...pattern.accept<StringifyResult, this>(this),
            sigils.SP,
            this.keywords.caseBranchBegin,
            !isExpressionBlockExpr && sigils.SP,
            ...expression.accept<StringifyResult, this>(this),
          ];

          if (utils.isLastIndex(index, array)) return stringified;
          return stringified.concat(sigils.CONT);
        }),
        sigils.END,
      );
    } else {
      stringified.push(
        sigils.BEGIN,
        ...ast.placeholder().accept<StringifyResult, this>(this),
        sigils.SP,
        this.keywords.caseBranchBegin,
        sigils.SP,
        ...ast.placeholder().accept<StringifyResult, this>(this),
        sigils.END,
      );
    }

    return stringified;
  }
}

// -----------------------------------------------------------------------------

// deno-lint-ignore no-empty-interface
interface StringifyOptions extends AstVisitorOptions {}

export function stringify(
  module: ast.Module,
  options: StringifyOptions = {},
): string {
  return module
    .map((nodes) => {
      return nodes.flatMap((node, index, array) => {
        if (options.stripComments && node instanceof ast.CommentNode) {
          return [];
        }

        const processed = processTopLevelNode(node, options);
        if (utils.isLastIndex(index, array)) return processed;
        return processed.concat(sigils.NL);
      });
    })
    .map((tokenBlock) => tokenBlock.join(''))
    .flatMap((block, index, array) => {
      if (utils.isLastIndex(index, array)) return block;
      return [block, sigils.NL, sigils.NL];
    })
    .join('');
}

function processTopLevelNode(
  node: ast.TopLevelNode,
  options: StringifyOptions,
): string[] {
  const visitor = new StringifyVisitor(options);
  const stringified = node
    .accept<StringifyResult, typeof visitor>(visitor)
    .filter((token): token is string => Boolean(token));

  return [...processStringified(stringified, options.indentationCount ?? 2)];
}

function* processStringified(
  tokens: string[],
  indentationCount: number,
): Generator<string> {
  let currIndent = 0;
  for (const token of tokens) {
    if (!token.startsWith('<!--')) {
      yield token;
    } else {
      switch (token) {
        case sigils.BEGIN:
          currIndent += indentationCount;
          yield sigils.NL;
          yield indent(currIndent);
          break;
        case sigils.CONT:
          yield sigils.NL;
          yield indent(currIndent);
          break;
        case sigils.END:
          currIndent = Math.max(0, currIndent - indentationCount);
          break;
        case sigils.RESET:
          yield sigils.NL;
          currIndent = 0;
          break;
        default:
          yield sigils.NL;
          yield token;
      }
    }
  }
}

function indent(times: number) {
  return sigils.SP.repeat(Math.max(0, times));
}
