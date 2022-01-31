// deno-lint-ignore-file no-explicit-any

import { Declaration } from "./decl.ts";
import { LiteralExpression } from "./mod.ts";
import { AstVisitor } from "./visitors/mod.ts";

type Identifier = string & { __identifierBrand: any };
export type Type = string & { __typeBrand: any };
export type OptionalType = Type | null;

export type TypedIdentifier = { identifier: IdentifierNode; type_: Type };
export type OptionallyTypedIdentifier = {
  identifier: IdentifierNode;
  type_: OptionalType;
};

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

export const type = (name: string): Type => name as Type;

export const path = (head: string, ...tail: string[]): PathNode =>
  new PathNode([head, ...tail].map(ident));

export const inferType = (): null => null;

export const typedIdent = (
  identifier: string,
  type: Type
): TypedIdentifier => ({
  identifier: ident(identifier),
  type_: type,
});

export const optTypedIdent = (
  identifier: string,
  type: Type | null
): OptionallyTypedIdentifier => ({
  identifier: ident(identifier),
  type_: type,
});

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
    readonly message: string,
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

export class PathNode extends AstNode {
  constructor(readonly components: IdentifierNode[]) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitPathNode(this);
  }
}

export type Program = TopLevelNode[];
export type TopLevelNode = CommentNode | Declaration;

export function splitStringInto(string: string, count: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < string.length; i += count) {
    parts.push(string.slice(i, i + count));
  }
  return parts;
}

export function capitalizeModuleName(string: string): string {
  if (string.length == 2) return string.toUpperCase();
  return string.charAt(0).toUpperCase() + string.slice(1);
}
