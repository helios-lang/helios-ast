import {
  AstNode,
  IdentifierNode,
  MaybeTypedIdentifier,
  PathNode,
  TypeNodeChild,
  TypeNodeOrNull,
} from './common.ts';

import { Expression } from './expr.ts';
import { AstVisitor } from './visitors/mod.ts';

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
    readonly parameters: MaybeTypedIdentifier[],
    readonly returnType: TypeNodeOrNull,
    readonly body: Expression,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitFunctionDeclaration(this);
  }
}

export class TypeDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly body: TypeNodeChild,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitTypeDeclaration(this);
  }
}
