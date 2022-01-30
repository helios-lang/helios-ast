import {
  AstNode,
  Identifier,
  Literal,
  Operator,
  OptionallyTypedIdentifier,
  OptionalType,
  Path,
} from "./common.ts";

import { Declaration } from "./decl.ts";
import { AstVisitor } from "./visitors.ts";

export abstract class Expression extends AstNode {}

export class IdentifierExpression extends Expression {
  constructor(readonly identifier: Identifier) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitIdentifierExpression(this);
  }
}

export class LiteralExpression extends Expression {
  constructor(readonly literal: Literal) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitLiteralExpression(this);
  }
}

export class ListExpression extends Expression {
  constructor(readonly contents: Expression[]) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitListExpression(this);
  }
}

export class CallExpression extends Expression {
  constructor(
    readonly function_: Identifier | Path,
    readonly arguments_: Expression[]
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitCallExpression(this);
  }
}

export class DotExpression extends Expression {
  constructor(readonly components: (Identifier | CallExpression)[]) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitDotExpression(this);
  }
}

export class UnaryExpression extends Expression {
  constructor(readonly operator: Operator, readonly expression: Expression) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitUnaryExpression(this);
  }
}

export class BinaryExpression extends Expression {
  constructor(
    readonly operator: Operator,
    readonly lhs: Expression,
    readonly rhs: Expression
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBinaryExpression(this);
  }
}

export class BlockExpression extends Expression {
  constructor(readonly items: (Declaration | Expression)[]) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBlockExpression(this);
  }
}

export class LambdaExpression extends Expression {
  constructor(
    readonly parameters: OptionallyTypedIdentifier[],
    readonly returnType: OptionalType,
    readonly body: Expression
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitLambdaExpression(this);
  }
}
