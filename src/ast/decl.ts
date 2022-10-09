import {
  AlwaysTypedIdentifier,
  AstNode,
  IdentifierNode,
  MaybeTypedIdentifier,
  PathNode,
  TypeIdentifierNode,
  TypeNodeOrNull,
} from './common.ts';

import { Expression } from './expr.ts';
import { AstVisitor } from './visitors/mod.ts';

export abstract class Declaration extends AstNode {}

type ImportDeclarationExposedIdentifiers = {
  identifier: string;
  rename?: string;
};

type ImportDeclarationOptions = {
  external?: boolean;
  rename?: string | undefined;
  exposedIdentifiers?: ImportDeclarationExposedIdentifiers[];
};

export class ImportDeclaration extends Declaration {
  readonly path: PathNode;
  readonly external: ImportDeclarationOptions['external'];
  readonly rename: ImportDeclarationOptions['rename'];
  readonly exposedIdentifiers: ImportDeclarationOptions['exposedIdentifiers'];

  constructor(
    path: PathNode,
    { external, rename, exposedIdentifiers }: ImportDeclarationOptions = {},
  ) {
    super();
    this.path = path;
    this.external = external;
    this.rename = rename;
    this.exposedIdentifiers = exposedIdentifiers;
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitImportDeclaration(this);
  }
}

export class ImportDeclarationGroup extends Declaration {
  constructor(readonly imports: ReadonlyArray<ImportDeclaration>) {
    super();
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitImportDeclarationGroup(this);
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

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitBindingDeclaration(this);
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

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitFunctionDeclaration(this);
  }
}

export class ConstructorDeclaration extends Declaration {
  constructor(
    readonly identifier: IdentifierNode,
    readonly parameters: ReadonlyArray<AlwaysTypedIdentifier> = [],
  ) {
    super();
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitConstructorDeclaration(this);
  }
}

export class SumTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: TypeIdentifierNode,
    readonly fields: ReadonlyArray<AlwaysTypedIdentifier>,
  ) {
    super();
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitSumTypeDeclaration(this);
  }
}

export class ProductTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: TypeIdentifierNode,
    readonly constructors: ReadonlyArray<ConstructorDeclaration>,
  ) {
    super();
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitProductTypeDeclaration(this);
  }
}

export class TypeAliasDeclaration extends Declaration {
  constructor(
    readonly identifier: TypeIdentifierNode,
    readonly type: TypeIdentifierNode | PathNode,
  ) {
    super();
  }

  *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitTypeAliasDeclaration(this);
  }
}
