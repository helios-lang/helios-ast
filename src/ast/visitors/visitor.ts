// deno-lint-ignore-file no-unused-vars

import * as common from '../common.ts';
import * as decl from '../decl.ts';
import * as expr from '../expr.ts';
import * as sigils from '../sigils.ts';
import * as strings from '../strings.ts';
import * as utils from '../utils.ts';

export interface AstVisitorOptions {
  /**
   * Whether or not imports should include the file extension `".he"` at the
   * end. This only applies to string imports.
   *
   * @default false
   */
  importWithFileExtension?: boolean;

  /**
   * The indentation size in terms of the count of space characters.
   *
   * @default 2
   */
  indentationCount?: number;

  /**
   * Whether or not to add trailing separators (e.g. `","`) at the end of
   * list-like nodes (e.g. function parameters).
   *
   * @default false
   */
  preferTrailingSeparators?: boolean;

  /**
   * Whether or not to import modules using string literals.
   *
   * This type of imports allow referencing modules relative to the current file
   * With this option disabled, imports will look like:
   *
   * ```
   * import foo.bar
   * import super.foo.bar
   * ```
   *
   * Otherwise, they will look like this with this option turned on:
   *
   * ```
   * import "foo/bar"
   * import "../foo/bar"
   * ```
   *
   * Refer to `importWithFileExtension` to determine whether file extensions are
   * included in string imports.
   *
   * @default false
   */
  stringImports?: boolean;

  /**
   * Whether or not to remove all types of comments from the final output.
   *
   * @default false
   */
  stripComments?: boolean;

  /**
   * Whether or not to start module identifiers with an uppercased letter.
   *
   * @default false
   */
  uppercaseModules?: boolean;
}

type KeywordDictionary = typeof strings.keyword;
type SymbolDictionary = typeof strings.symbol;

export interface AstVisitorDictionary {
  keywords?: Partial<KeywordDictionary>;
  symbols?: Partial<SymbolDictionary>;
}

export type AstVisitorMaybeContent = string | false;
export type AstVisitorNodeKind =
  | 'comment'
  | 'constructor'
  | 'function'
  | 'generic'
  | 'identifier'
  | 'keyword'
  | 'module'
  | 'number'
  | 'operator'
  | 'string'
  | 'symbol'
  | 'type';

export abstract class AstVisitor<R> {
  private readonly keywords: KeywordDictionary;
  private readonly symbols: SymbolDictionary;
  private readonly options: AstVisitorOptions;

  /**
   * Construct a new visitor with some options.
   *
   * @param options Customised output options.
   * @param dictionary Customised keywords and symbols.
   */
  public constructor(
    options: AstVisitorOptions = {},
    dictionary: AstVisitorDictionary = {},
  ) {
    this.options = options;
    this.keywords = { ...strings.keyword, ...dictionary.keywords };
    this.symbols = { ...strings.symbol, ...dictionary.symbols };
  }

  /**
   * Invoked whenever a new AST node is encountered.
   *
   * This visitor is responsible for constructing
   *
   * @param kind The internal representation of the node.
   * @param contents The contents that form the provided node.
   */
  protected abstract onYieldNode(
    kind: AstVisitorNodeKind,
    ...contents: AstVisitorMaybeContent[]
  ): R;

  // --- MISCELLANEOUS VISITORS ---

  public *visitBlankLineNode(_: common.BlankLineNode): Generator<R> {
    /* Don't yield anything */
  }

  public *visitCommentNode(node: common.CommentNode): Generator<R> {
    const lines = node.textContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      yield this.onYieldNode(
        'comment',
        node.isDocComment
          ? this.symbols.docCommentBegin
          : this.symbols.commentBegin,
        line.length > 0 && sigils.SP + line,
        !utils.isLastIndex(i, lines) && sigils.NL,
      );
    }
  }

  public *visitPlaceholderNode(node: common.PlaceholderNode): Generator<R> {
    yield this.onYieldNode('keyword', this.symbols.placeholder);
  }

  public *visitPathNode(node: common.PathNode): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitIdentifierNode(node: common.IdentifierNode): Generator<R> {
    yield this.onYieldNode('identifier', node.name);
  }

  public *visitTypeIdentifierNode(
    node: common.TypeIdentifierNode,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitTypeNode(node: common.TypeNode): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  // --- DECLARATION VISITORS ---

  public *visitImportDeclaration(node: decl.ImportDeclaration): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitImportDeclarationGroup(
    node: decl.ImportDeclarationGroup,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitBindingDeclaration(node: decl.BindingDeclaration): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitFunctionDeclaration(
    node: decl.FunctionDeclaration,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitConstructorDeclaration(
    node: decl.ConstructorDeclaration,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitSumTypeDeclaration(node: decl.SumTypeDeclaration): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitProductTypeDeclaration(
    node: decl.ProductTypeDeclaration,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitTypeAliasDeclaration(
    node: decl.TypeAliasDeclaration,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  // --- EXPRESSION VISITORS ---

  public *visitLiteralExpression(expr: expr.LiteralExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitInterpolatedStringExpression(
    expr: expr.InterpolatedStringExpression,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitTupleExpression(expr: expr.TupleExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitListExpression(expr: expr.ListExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitCallExpression(expr: expr.CallExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitConstructorExpression(
    expr: expr.ConstructorExpression,
  ): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitDotExpression(expr: expr.DotExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitUnaryExpression(expr: expr.UnaryExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitBinaryExpression(expr: expr.BinaryExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitChainExpression(expr: expr.ChainExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitBlockExpression(expr: expr.BlockExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitLambdaExpression(expr: expr.LambdaExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitIfExpression(expr: expr.IfExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }

  public *visitCaseExpression(expr: expr.CaseExpression): Generator<R> {
    yield this.onYieldNode('keyword', '???');
  }
}
