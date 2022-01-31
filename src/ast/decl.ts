import {
  AstNode,
  IdentifierNode,
  OptionallyTypedIdentifier,
  OptionalType,
  PathNode,
  TypedIdentifier,
} from "./common.ts";

import { Expression } from "./expr.ts";
import { AstVisitor } from "./visitors/mod.ts";

export abstract class Declaration extends AstNode {}

export class ImportDeclaration extends Declaration {
  constructor(readonly path: PathNode) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitImportDeclaration(this);
  }
}

export class ImportDeclarationGroup extends Declaration {
  constructor(readonly imports: ImportDeclaration[]) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitImportDeclarationGroup(this);
  }
}

export class BindingDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
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
    readonly identifier: IdentifierNode,
    readonly parameters: OptionallyTypedIdentifier[],
    readonly returnType: OptionalType,
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
    readonly identifier: IdentifierNode,
    readonly fields?: TypedIdentifier[]
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitRecordTypeDeclaration(this);
  }
}
