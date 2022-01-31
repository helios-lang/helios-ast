import * as common from "../common.ts";

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

export abstract class AstVisitor<R> {
  // --- MISCELLANEOUS ---

  abstract visitComment(comment: common.Comment): R;

  // --- DECLARATIONS ---

  abstract visitBindingDeclaration(decl: BindingDeclaration): R;
  abstract visitFunctionDeclaration(decl: FunctionDeclaration): R;
  abstract visitRecordTypeDeclaration(decl: RecordTypeDeclaration): R;

  // --- EXPRESSIONS ---

  abstract visitIdentifierExpression(expr: IdentifierExpression): R;
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
