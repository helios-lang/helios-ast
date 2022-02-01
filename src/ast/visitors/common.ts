import * as common from "../common.ts";
import * as strings from "../strings.ts";

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

export interface AstVisitorOptions {
  stringImports?: boolean;
  indentationCount?: number;
  stripComments?: boolean;
  uppercaseModules?: boolean;
  keywords?: Partial<typeof strings.keyword>;
  symbols?: Partial<typeof strings.symbol>;
}

export abstract class AstVisitor<R> {
  readonly keywords: typeof strings.keyword;
  readonly symbols: typeof strings.symbol;
  readonly options: Omit<
    AstVisitorOptions,
    "keywordDictionary" | "symbolDictionary"
  >;

  constructor(options: AstVisitorOptions) {
    this.options = options;
    this.keywords = { ...strings.keyword, ...options.keywords };
    this.symbols = { ...strings.symbol, ...options.symbols };
  }

  // --- MISCELLANEOUS ---

  abstract visitCommentNode(node: common.CommentNode): R;
  abstract visitPathNode(node: common.PathNode): R;
  abstract visitAnonymousRecordNode(node: common.AnonymousRecordNode): R;
  abstract visitIdentifierNode(node: common.IdentifierNode): R;
  abstract visitModuleNode(node: common.ModuleIdentifierNode): R;
  abstract visitTypeNode(node: common.TypeNode): R;

  // --- DECLARATIONS ---

  abstract visitImportDeclaration(decl: ImportDeclaration): R;
  abstract visitImportDeclarationGroup(decl: ImportDeclarationGroup): R;
  abstract visitBindingDeclaration(decl: BindingDeclaration): R;
  abstract visitFunctionDeclaration(decl: FunctionDeclaration): R;
  abstract visitTypeDeclaration(decl: TypeDeclaration): R;

  // --- EXPRESSIONS ---

  abstract visitLiteralExpression(expr: LiteralExpression): R;
  abstract visitInterpolatedStringExpression(
    expr: InterpolatedStringExpression
  ): R;
  abstract visitTupleExpression(expr: TupleExpression): R;
  abstract visitListExpression(expr: ListExpression): R;
  abstract visitCallExpression(expr: CallExpression): R;
  abstract visitDotExpression(expr: DotExpression): R;
  abstract visitUnaryExpression(expr: UnaryExpression): R;
  abstract visitBinaryExpression(expr: BinaryExpression): R;
  abstract visitBlockExpression(expr: BlockExpression): R;
  abstract visitLambdaExpression(expr: LambdaExpression): R;
}
