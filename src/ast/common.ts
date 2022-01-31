// deno-lint-ignore-file no-explicit-any

import { Declaration } from "./decl.ts";
import { LiteralExpression } from "./mod.ts";
import { AstVisitor } from "./visitors/mod.ts";

export type Identifier = string & { __identifierBrand: any };
export type Path = Identifier[];
export type Type = string & { __typeBrand: any };
export type OptionalType = Type | null;

export type TypedIdentifier = { identifier: Identifier; type_: Type };
export type OptionallyTypedIdentifier = {
  identifier: Identifier;
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

export const comment = (message: string): Comment => new Comment(message);

export const ident = (identifier: string): Identifier =>
  identifier as Identifier;

export const type = (name: string): Type => name as Type;

export const path = (head: string, ...tail: string[]): Path =>
  [head, ...tail] as Path;

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

export class Comment extends AstNode {
  constructor(readonly message: string) {
    super();
  }

  accept<R, V extends AstVisitor<R>>(visitor: V): R {
    return visitor.visitComment(this);
  }
}

export type Program = TopLevelNode[];
export type TopLevelNode = Comment | Declaration;
