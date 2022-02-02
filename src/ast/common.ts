// deno-lint-ignore-file no-explicit-any

import { Declaration } from "./decl.ts";
import { LiteralExpression } from "./mod.ts";
import { AstVisitor } from "./visitors/mod.ts";

type Identifier = string & { __identifierBrand: any };
export type Operator = "+" | "-" | "*" | "/";

export type Literal =
  | { kind: "boolean"; value: boolean }
  | { kind: "integer"; value: number }
  | { kind: "float"; value: number }
  | { kind: "string"; value: string };

export type Atom =
  | { kind: "identifier"; identifier: Identifier }
  | { kind: "literal"; literal: Literal }
  | { kind: "list"; values: Atom[] };

export type StringifyResult = (false | string)[];

export const comment = (...contents: string[]): CommentNode =>
  new CommentNode(contents.join("\n"));

export const docComment = (...contents: string[]): CommentNode =>
  new CommentNode(contents.join("\n"), true);

export const ident = (identifier: string): IdentifierNode =>
  new IdentifierNode(identifier as Identifier);

export const path = (head: string, ...tail: string[]): PathNode =>
  new PathNode([head, ...tail].map(ident));

export function type(child: TypeNodeChild): TypeNode {
  return new TypeNode(child);
}

export const inferredType = (): TypeNodeOrNull => null;

export function typedIdent(
  identifier: string,
  child: TypeNodeChild
): AlwaysTypedIdentifier {
  return { identifier: ident(identifier), identifierType: type(child) };
}

export function optTypedIdent(
  identifier: string,
  child: TypeNodeChild | null = null
): MaybeTypedIdentifier {
  return {
    identifier: ident(identifier),
    identifierType: child ? type(child) : null,
  };
}

export const literal = (
  value: boolean | number | string,
  floatingPoint = false
): LiteralExpression => {
  switch (typeof value) {
    case "boolean":
      return LiteralExpression.Boolean(value);
    case "number":
      if (floatingPoint || value.toString().includes(".")) {
        return LiteralExpression.Float(value);
      } else {
        return LiteralExpression.Integer(value);
      }
    case "string":
    default:
      return LiteralExpression.String(String(value));
  }
};

export abstract class AstNode {
  abstract accept<R, V extends AstVisitor<R>>(visitor: V): R;
}

export class CommentNode extends AstNode {
  constructor(
    readonly comment: string,
    readonly isDocComment: boolean = false
  ) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitCommentNode(this);
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

export class ModuleIdentifierNode extends AstNode {
  constructor(readonly name: Identifier) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitModuleNode(this);
  }
}

export type TypeNodeOrNull = TypeNode | null;

export type TypeNodeChild = IdentifierNode | PathNode | AnonymousRecordNode;

export class TypeNode extends AstNode {
  constructor(readonly child: TypeNodeChild) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitTypeNode(this);
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

export class AnonymousRecordNode extends AstNode {
  constructor(readonly fields: ReadonlyArray<AlwaysTypedIdentifier>) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitAnonymousRecordNode(this);
  }
}

type IdentifierWithType<T> = { identifier: IdentifierNode; identifierType: T };
export type AlwaysTypedIdentifier = IdentifierWithType<TypeNode>;
export type MaybeTypedIdentifier = IdentifierWithType<TypeNodeOrNull>;

export type Program = TopLevelNode[];
export type TopLevelNode = CommentNode | Declaration;

export function capitalizeModuleName(string: string): string {
  if (string.length == 2) return string.toUpperCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}
