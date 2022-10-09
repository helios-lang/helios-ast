// deno-lint-ignore-file require-yield no-unused-vars

export * from './constructors.ts';

import { Declaration } from './decl.ts';
import { AstVisitor } from './visitors/mod.ts';

// deno-lint-ignore no-explicit-any
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
  /**
   * Process this node with the provided visitor.
   *
   * @param visitor An `AstVisitor` instance to process this `AstNode`.
   */
  abstract accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R>;
}

export class BlankLineNode extends AstNode {
  constructor() {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitBlankLineNode(this);
  }
}

export class CommentNode extends AstNode {
  constructor(
    readonly textContent: string,
    readonly isDocComment: boolean = false,
  ) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitCommentNode(this);
  }
}

export class PlaceholderNode extends AstNode {
  constructor() {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitPlaceholderNode(this);
  }
}

export type TypeNodeOrNull = TypeNode | null;

export type TypeNodeContent =
  | TypeIdentifierNode
  | PathNode
  | AnonymousConstructorNode;

export class TypeNode extends AstNode {
  constructor(readonly content: TypeNodeContent) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitTypeNode(this);
  }
}

export class IdentifierNode extends AstNode {
  constructor(readonly name: Identifier) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitIdentifierNode(this);
  }
}

export class TypeIdentifierNode extends AstNode {
  constructor(readonly name: Identifier, readonly generics?: GenericsListNode) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitTypeIdentifierNode(this);
  }
}

export class PathNode extends AstNode {
  constructor(readonly components: ReadonlyArray<IdentifierNode>) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    yield* visitor.visitPathNode(this);
  }
}

export class AnonymousConstructorNode extends AstNode {
  constructor(readonly fields: ReadonlyArray<AlwaysTypedIdentifier>) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    // yield* visitor.visitAnonymousConstructorNode(this);
    throw new Error('Unimplemented');
  }
}

export class GenericsListNode extends AstNode {
  constructor(readonly identifiers: ReadonlyArray<TypeIdentifierNode>) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    // yield* visitor.visitGenericsListNode(this);
    throw new Error('Unimplemented');
  }
}

export class ExportedDeclarationNode extends AstNode {
  constructor(readonly declaration: Declaration, readonly rename?: string) {
    super();
  }

  override *accept<R, V extends AstVisitor<R>>(visitor: V): Generator<R> {
    // yield* visitor.visitExportedDeclarationNode(this);
    throw new Error('Unimplemented');
  }
}

export type IdentifierWithSuffix<T> = { identifier: IdentifierNode; suffix: T };
export type AlwaysTypedIdentifier = IdentifierWithSuffix<TypeNode>;
export type MaybeTypedIdentifier = IdentifierWithSuffix<TypeNodeOrNull>;

export type Module = ReadonlyArray<ReadonlyArray<TopLevelNode>>;
export type TopLevelNode = CommentNode | Declaration;
