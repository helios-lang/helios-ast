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
} from '../decl.ts';

import {
  BinaryExpression,
  BlockExpression,
  CallExpression,
  ConstructorExpression,
  DotExpression,
  InterpolatedStringExpression,
  LambdaExpression,
  ListExpression,
  LiteralExpression,
  TupleExpression,
  UnaryExpression,
} from '../expr.ts';

export type StringifyResult = (string | false)[];

export class StringifyVisitor extends visitorCommon.AstVisitor<StringifyResult> {
  private toSeparatedList(
    nodes: ReadonlyArray<astCommon.AstNode>,
    separator = this.symbols.listSeparator,
    addSpace = true,
  ): StringifyResult {
    return nodes.flatMap((node, index, array) => {
      const stringified = node.accept<StringifyResult, this>(this);
      if (index === array.length - 1) return stringified;
      return addSpace
        ? stringified.concat(separator, sigils.SP)
        : stringified.concat(separator);
    });
  }

  private toParameterList(
    parameters: ReadonlyArray<astCommon.MaybeTypedIdentifier>,
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

      if (index === array.length - 1) return stringified;
      return stringified.concat(separator, sigils.SP);
    });
  }

  visitBlankLineNode(_: astCommon.BlankLineNode): StringifyResult {
    return [sigils.SKIP_NL];
  }

  visitCommentNode(node: astCommon.CommentNode): StringifyResult {
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

  visitIdentifierNode(node: astCommon.IdentifierNode): StringifyResult {
    return [node.name];
  }

  visitModuleNode(node: astCommon.ModuleIdentifierNode): StringifyResult {
    return [node.name];
  }

  visitTypeNode(node: astCommon.TypeNode): StringifyResult {
    return node.child.accept(this);
  }

  visitPathNode(node: astCommon.PathNode): StringifyResult {
    return node.components.flatMap((component, index, array) => {
      const stringified: StringifyResult = [
        this.options.uppercaseModules
          ? astCommon.capitalizeModuleName(component.name)
          : component.name,
      ];
      if (index === array.length - 1) return stringified;
      return stringified.concat(this.symbols.pathSeparator);
    });
  }

  visitAnonymousConstructorNode(
    node: astCommon.AnonymousConstructorNode,
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

  visitImportDeclaration(decl: ImportDeclaration): StringifyResult {
    const importContents: StringifyResult = [this.keywords.import, sigils.SP];

    if (this.options.stringImports) {
      importContents.push(
        this.symbols.stringBegin,
        decl.external && 'lib:',
        ...this.toSeparatedList(decl.path.components, '/', false),
        Boolean(this.options.addFileExtensionToImports) && `.${FILE_EXTENSION}`,
        this.symbols.stringEnd,
      );
    } else {
      importContents.push(
        ...decl.path.components.flatMap((component, index, array) => {
          const stringified: StringifyResult = component.accept(this);

          if (this.options.uppercaseModules) {
            for (let i = 0; i < stringified.length; i++) {
              const identifier = stringified[i];
              if (typeof identifier === 'string') {
                stringified[i] = astCommon.capitalizeModuleName(identifier);
              }
            }
          }

          if (index === array.length - 1) return stringified;
          return stringified.concat(this.symbols.pathSeparator);
        }),
      );
    }

    return importContents;
  }

  visitImportDeclarationGroup(decl: ImportDeclarationGroup): StringifyResult {
    return decl.imports.flatMap((node) =>
      node.accept<StringifyResult, this>(this).concat(sigils.NL),
    );
  }

  visitBindingDeclaration(decl: BindingDeclaration): StringifyResult {
    return [
      this.keywords.immutableBinding,
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
      // ...(decl.returnType
      //   ? [this.symbols.functionReturn, sigils.SP, decl.returnType, sigils.SP]
      //   : []),
      this.symbols.functionBegin,
      !(decl.body instanceof BlockExpression) && sigils.SP,
      ...decl.body.accept<StringifyResult, this>(this),
    ];
  }

  visitConstructorDeclaration(decl: ConstructorDeclaration): StringifyResult {
    return [
      ...decl.identifier.accept<StringifyResult, this>(this),
      this.symbols.constructorInvokeBegin,
      ...this.toParameterList(
        decl.parameters,
        this.symbols.constructorParameterSeparator,
      ),
      this.symbols.constructorInvokeEnd,
    ];
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
      ...new ConstructorDeclaration(decl.identifier, decl.fields).accept<
        StringifyResult,
        this
      >(this),
      sigils.END,
    ];
  }

  visitProductTypeDeclaration(decl: ProductTypeDeclaration): StringifyResult {
    return [];
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
    const stringifiedFunctionIdentifier: StringifyResult = [];

    if (expr.function_ instanceof astCommon.IdentifierNode) {
      stringifiedFunctionIdentifier.push(expr.function_.name);
    } else {
      const components = expr.function_.components;
      const allButLast = components.slice(0, -1);
      const last = components.at(-1);

      stringifiedFunctionIdentifier.push(
        ...new astCommon.PathNode(allButLast).accept<StringifyResult, this>(
          this,
        ),
      );

      if (last) {
        stringifiedFunctionIdentifier.push(
          this.symbols.pathSeparator,
          last.name,
        );
      }
    }

    return [
      ...stringifiedFunctionIdentifier,
      this.symbols.functionInvokeBegin,
      ...this.toSeparatedList(
        expr.arguments_,
        this.symbols.functionParameterSeparator,
      ),
      this.symbols.functionInvokeEnd,
    ];
  }

  visitConstructorExpression(expr: ConstructorExpression): StringifyResult {
    return [
      ...expr.identifier.accept<StringifyResult, this>(this),
      this.symbols.functionInvokeBegin,
      ...expr.arguments_.flatMap((argument, index, array) => {
        const stringified = [
          ...argument.identifier.accept<StringifyResult, this>(this),
          this.symbols.labelledParameterAnnotation,
          sigils.SP,
          ...argument.suffix.accept<StringifyResult, this>(this),
        ];
        if (index === array.length - 1) return stringified;
        return stringified.concat(
          this.symbols.functionParameterSeparator,
          sigils.SP,
        );
      }),
      this.symbols.functionInvokeEnd,
    ];
  }

  visitDotExpression(expr: DotExpression): StringifyResult {
    return expr.components.flatMap((component, index, array) => {
      const stringified =
        typeof component === 'string'
          ? component
          : component.accept<StringifyResult, this>(this);
      if (index === array.length - 1) return stringified;
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
}

// -----------------------------------------------------------------------------

// deno-lint-ignore no-empty-interface
interface StringifyOptions extends visitorCommon.AstVisitorOptions {}

export function stringify(
  program: astCommon.Program,
  options: StringifyOptions = {},
): string {
  let _program = program;
  if (options.stripComments) {
    _program = program.filter(
      (item) => !(item instanceof astCommon.CommentNode),
    );
  }

  const processTopLevelNodes = (node: astCommon.TopLevelNode) => [
    ...processIndentsForNode(node, options),
    sigils.NL,
  ];

  return _program.flatMap(processTopLevelNodes).join('').trim();
}

function processIndentsForNode(
  node: astCommon.TopLevelNode,
  options: StringifyOptions,
) {
  const visitor = new StringifyVisitor(options);
  const tokens = node
    .accept<StringifyResult, typeof visitor>(visitor)
    .filter((token): token is string => Boolean(token));

  const processedTokens: string[] = [];
  for (const token of processIndentsGenerator(
    tokens,
    options.indentationCount ?? 2,
  )) {
    processedTokens.push(token);
  }

  return processedTokens;
}

function* processIndentsGenerator(tokens: string[], indentationCount: number) {
  let currIndent = 0;
  for (const token of tokens) {
    if (!token.startsWith('<!--')) {
      yield token;
    } else {
      if (token === sigils.SKIP_NL) continue;
      else yield sigils.NL;

      switch (token) {
        case sigils.BEGIN:
          currIndent += indentationCount;
          yield indent(currIndent);
          break;
        case sigils.CONT:
          yield indent(currIndent);
          break;
        case sigils.END:
          currIndent = Math.max(0, currIndent - indentationCount);
          yield indent(currIndent);
          break;
        case sigils.RESET:
          currIndent = 0;
          break;
        default:
          yield token;
      }
    }
  }
}

function indent(times: number) {
  return sigils.SP.repeat(Math.max(0, times));
}
