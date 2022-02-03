import {
  AlwaysTypedIdentifier,
  AstNode,
  IdentifierNode,
  MaybeTypedIdentifier,
  PathNode,
  TypeNodeOrNull,
} from './common.ts';

import { Expression } from './expr.ts';
import { AstVisitor } from './visitors/mod.ts';

export abstract class Declaration extends AstNode {}

export class ImportDeclaration extends Declaration {
  constructor(readonly path: PathNode, readonly external: boolean = false) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitImportDeclaration(this);
  }
}

export class ImportDeclarationGroup extends Declaration {
  constructor(readonly imports: ReadonlyArray<ImportDeclaration>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitImportDeclarationGroup(this);
  }
}

export class BindingDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly identifierType: TypeNodeOrNull,
    readonly value: Expression,
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
    readonly parameters: ReadonlyArray<MaybeTypedIdentifier>,
    readonly returnType: TypeNodeOrNull,
    readonly body: Expression,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitFunctionDeclaration(this);
  }
}

export class ConstructorDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly parameters: ReadonlyArray<AlwaysTypedIdentifier>,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitConstructorDeclaration(this);
  }
}

export class SumTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly fields: ReadonlyArray<AlwaysTypedIdentifier>,
    readonly generics?: ReadonlyArray<string>,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitSumTypeDeclaration(this);
  }
}

export class ProductTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly constructors: ReadonlyArray<ConstructorDeclaration>,
    readonly generics?: ReadonlyArray<string>,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitProductTypeDeclaration(this);
  }
}
