import {
  AstNode,
  Identifier,
  OptionallyTypedIdentifier,
  OptionalType,
  TypedIdentifier,
} from "./common.ts";

import { Expression } from "./expr.ts";
import { AstVisitor } from "./visitors.ts";

export abstract class Declaration extends AstNode {}

export class BindingDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly type_: OptionalType,
    readonly value: Expression
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBindingDeclaration(this);
  }
}

export class FunctionDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly parameters: OptionallyTypedIdentifier[],
    readonly return_: OptionalType,
    readonly body: Expression
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitFunctionDeclaration(this);
  }
}

export class RecordTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly fields?: TypedIdentifier[]
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitRecordTypeDeclaration(this);
  }
}
