import * as common from "../common.ts";

import {
  BindingDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  ImportDeclarationGroup,
  RecordTypeDeclaration,
} from "../decl.ts";

import {
  BinaryExpression,
  BlockExpression,
  CallExpression,
  DotExpression,
  LambdaExpression,
  ListExpression,
  LiteralExpression,
  TupleExpression,
  UnaryExpression,
} from "../expr.ts";

export abstract class AstVisitor<R> {
  // --- MISCELLANEOUS ---

  abstract visitCommentNode(comment: common.CommentNode): R;
  abstract visitPathNode(path: common.PathNode): R;
  abstract visitIdentifierNode(expr: common.IdentifierNode): R;

  // --- DECLARATIONS ---

  abstract visitImportDeclaration(decl: ImportDeclaration): R;
  abstract visitImportDeclarationGroup(decl: ImportDeclarationGroup): R;
  abstract visitBindingDeclaration(decl: BindingDeclaration): R;
  abstract visitFunctionDeclaration(decl: FunctionDeclaration): R;
  abstract visitRecordTypeDeclaration(decl: RecordTypeDeclaration): R;

  // --- EXPRESSIONS ---

  abstract visitLiteralExpression(expr: LiteralExpression): R;
  abstract visitTupleExpression(expr: TupleExpression): R;
  abstract visitListExpression(expr: ListExpression): R;
  abstract visitCallExpression(expr: CallExpression): R;
  abstract visitDotExpression(expr: DotExpression): R;
  abstract visitUnaryExpression(expr: UnaryExpression): R;
  abstract visitBinaryExpression(expr: BinaryExpression): R;
  abstract visitBlockExpression(expr: BlockExpression): R;
  abstract visitLambdaExpression(expr: LambdaExpression): R;
}
