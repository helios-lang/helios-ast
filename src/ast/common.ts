// deno-lint-ignore-file no-explicit-any

export * from './constructors.ts';

import { Declaration } from './decl.ts';
import { AstVisitor } from './visitors/mod.ts';

export type Identifier = string & { __identifierBrand: any };
export type Operator = string;

export type Literal =
  | { kind: 'boolean'; value: boolean }
  | { kind: 'integer'; value: number }
  | { kind: 'float'; value: number }
  | { kind: 'string'; value: string };

export type Atom =
  | { kind: 'identifier'; identifier: Identifier }
  | { kind: 'literal'; literal: Literal }
  | { kind: 'list'; values: Atom[] };

export abstract class AstNode {
  abstract accept<R, V extends AstVisitor<R>>(visitor: V): R;
}

export class BlankLineNode extends AstNode {
  constructor() {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitBlankLineNode(this);
  }
}

export class CommentNode extends AstNode {
  constructor(
    readonly comment: string,
    readonly isDocComment: boolean = false,
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitCommentNode(this);
  }
}

export class PlaceHolderNode extends AstNode {
  constructor() {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitPlaceholderNode(this);
  }
}

export type TypeNodeOrNull = TypeNode | null;

export type TypeNodeChild =
  | TypeIdentifierNode
  | PathNode
  | AnonymousConstructorNode;

export class TypeNode extends AstNode {
  constructor(readonly child: TypeNodeChild) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitTypeNode(this);
  }
}

export class IdentifierNode extends AstNode {
  constructor(readonly name: Identifier) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitIdentifierNode(this);
  }
}

export class TypeIdentifierNode extends AstNode {
  constructor(readonly name: Identifier, readonly generics?: GenericsListNode) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitTypeIdentifierNode(this);
  }
}

export class PathNode extends AstNode {
  constructor(readonly components: ReadonlyArray<IdentifierNode>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitPathNode(this);
  }
}

export class AnonymousConstructorNode extends AstNode {
  constructor(readonly fields: ReadonlyArray<AlwaysTypedIdentifier>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitAnonymousConstructorNode(this);
  }
}

export class GenericsListNode extends AstNode {
  constructor(readonly identifiers: ReadonlyArray<TypeIdentifierNode>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitGenericsListNode(this);
  }
}

export class ExportedDeclarationNode extends AstNode {
  constructor(readonly declaration: Declaration, readonly rename?: string) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitExportedDeclarationNode(this);
  }
}

export type IdentifierWithSuffix<T> = { identifier: IdentifierNode; suffix: T };
export type AlwaysTypedIdentifier = IdentifierWithSuffix<TypeNode>;
export type MaybeTypedIdentifier = IdentifierWithSuffix<TypeNodeOrNull>;

export type Module = ReadonlyArray<ReadonlyArray<TopLevelNode>>;
export type TopLevelNode = CommentNode | Declaration;
