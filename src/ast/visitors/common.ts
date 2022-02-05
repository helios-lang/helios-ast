import * as common from '../common.ts';
import * as strings from '../strings.ts';

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

export interface ConfigurableAstVisitorOptions {
  importWithFileExtension?: boolean;
  indentationCount?: number;
  preferTrailingSeparators?: boolean;
  stringImports?: boolean;
  stripComments?: boolean;
  uppercaseModules?: boolean;
}

export interface AstVisitorOptions extends ConfigurableAstVisitorOptions {
  keywords?: Partial<typeof strings.keyword>;
  symbols?: Partial<typeof strings.symbol>;
}

export abstract class AstVisitor<R> {
  readonly keywords: typeof strings.keyword;
  readonly symbols: typeof strings.symbol;
  readonly options: Omit<
    AstVisitorOptions,
    'keywordDictionary' | 'symbolDictionary'
  >;

  constructor(options: AstVisitorOptions) {
    this.options = options;
    this.keywords = { ...strings.keyword, ...options.keywords };
    this.symbols = { ...strings.symbol, ...options.symbols };
  }

  // --- MISCELLANEOUS ---

  abstract visitBlankLineNode(node: common.BlankLineNode): R;
  abstract visitCommentNode(node: common.CommentNode): R;
  abstract visitPlaceholderNode(node: common.PlaceHolderNode): R;
  abstract visitPathNode(node: common.PathNode): R;
  abstract visitAnonymousConstructorNode(
    node: common.AnonymousConstructorNode,
  ): R;
  abstract visitIdentifierNode(node: common.IdentifierNode): R;
  abstract visitTypeIdentifierNode(node: common.TypeIdentifierNode): R;
  abstract visitTypeNode(node: common.TypeNode): R;
  abstract visitGenericsListNode(node: common.GenericsListNode): R;

  // --- DECLARATIONS ---

  abstract visitImportDeclaration(decl: ImportDeclaration): R;
  abstract visitImportDeclarationGroup(decl: ImportDeclarationGroup): R;
  abstract visitBindingDeclaration(decl: BindingDeclaration): R;
  abstract visitFunctionDeclaration(decl: FunctionDeclaration): R;
  abstract visitConstructorDeclaration(decl: ConstructorDeclaration): R;
  abstract visitSumTypeDeclaration(decl: SumTypeDeclaration): R;
  abstract visitProductTypeDeclaration(decl: ProductTypeDeclaration): R;
  abstract visitTypeAliasDeclaration(decl: TypeAliasDeclaration): R;

  // --- EXPRESSIONS ---

  abstract visitLiteralExpression(expr: LiteralExpression): R;
  abstract visitInterpolatedStringExpression(
    expr: InterpolatedStringExpression,
  ): R;
  abstract visitTupleExpression(expr: TupleExpression): R;
  abstract visitListExpression(expr: ListExpression): R;
  abstract visitCallExpression(expr: CallExpression): R;
  abstract visitConstructorExpression(expr: ConstructorExpression): R;
  abstract visitDotExpression(expr: DotExpression): R;
  abstract visitUnaryExpression(expr: UnaryExpression): R;
  abstract visitBinaryExpression(expr: BinaryExpression): R;
  abstract visitBlockExpression(expr: BlockExpression): R;
  abstract visitLambdaExpression(expr: LambdaExpression): R;
  abstract visitIfExpression(expr: IfExpression): R;
  abstract visitCaseExpression(expr: CaseExpression): R;
}
