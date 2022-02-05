import {
  AstNode,
  ident,
  IdentifierNode,
  IdentifierWithSuffix,
  Literal,
  MaybeTypedIdentifier,
  Operator,
  PathNode,
  TypeNodeOrNull,
} from './common.ts';

import { Declaration } from './decl.ts';
import { AstVisitor } from './visitors/mod.ts';

export type LabelledParameter = IdentifierWithSuffix<Expression>;

export const labelledParam = (
  identifier: string,
  expr: Expression,
): LabelledParameter => ({ identifier: ident(identifier), suffix: expr });

export const literal = (
  value: boolean | number | string,
  floatingPoint = false,
): LiteralExpression => {
  switch (typeof value) {
    case 'boolean':
      return LiteralExpression.Boolean(value);
    case 'number':
      if (floatingPoint || value.toString().includes('.')) {
        return LiteralExpression.Float(value);
      } else {
        return LiteralExpression.Integer(value);
      }
    case 'string':
    default:
      return LiteralExpression.String(String(value));
  }
};

export abstract class Expression extends AstNode {}

export class LiteralExpression extends Expression {
  constructor(readonly literal: Literal) {
    super();
  }

  static Boolean(value: boolean): LiteralExpression {
    return new LiteralExpression({ kind: 'boolean', value });
  }

  static Integer(value: number): LiteralExpression {
    return new LiteralExpression({ kind: 'integer', value });
  }

  static Float(value: number): LiteralExpression {
    return new LiteralExpression({ kind: 'float', value });
  }

  static String(value: string): LiteralExpression {
    return new LiteralExpression({ kind: 'string', value });
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitLiteralExpression(this);
  }
}

export class InterpolatedStringExpression extends Expression {
  constructor(readonly components: ReadonlyArray<string | Expression>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitInterpolatedStringExpression(this);
  }
}

export class TupleExpression extends Expression {
  constructor(readonly contents: ReadonlyArray<Expression>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitTupleExpression(this);
  }
}

export class ListExpression extends Expression {
  constructor(readonly contents: ReadonlyArray<Expression>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitListExpression(this);
  }
}

export class CallExpression extends Expression {
  constructor(
    readonly function_: IdentifierNode | PathNode,
    readonly arguments_: ReadonlyArray<Expression>,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitCallExpression(this);
  }
}

export class ConstructorExpression extends Expression {
  constructor(
    readonly identifier: IdentifierNode | PathNode,
    readonly arguments_: ReadonlyArray<LabelledParameter> = [],
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitConstructorExpression(this);
  }
}

export class DotExpression extends Expression {
  constructor(readonly components: (IdentifierNode | CallExpression)[]) {
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
    readonly rhs: Expression,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBinaryExpression(this);
  }
}

export class BlockExpression extends Expression {
  constructor(readonly items: ReadonlyArray<Declaration | Expression>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBlockExpression(this);
  }
}

export class LambdaExpression extends Expression {
  constructor(
    readonly parameters: ReadonlyArray<MaybeTypedIdentifier>,
    readonly returnType: TypeNodeOrNull,
    readonly body: Expression,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitLambdaExpression(this);
  }
}

export class IfExpression extends Expression {
  constructor(
    readonly condition: Expression,
    readonly thenBody: Expression,
    readonly elseBody?: Expression,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitIfExpression(this);
  }
}
