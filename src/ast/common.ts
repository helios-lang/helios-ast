// deno-lint-ignore-file no-explicit-any

import * as strings from "./strings.ts";
import { SP } from "./strings.ts";

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

export abstract class AstNode {
  abstract stringify(): StringifyResult;
}

export class Comment extends AstNode {
  constructor(readonly message: string) {
    super();
  }

  stringify(): StringifyResult {
    return [
      strings.symbol.commentStart,
      SP,
      this.message,
      // strings.symbol.commentEnd,
    ];
  }
}

export function toParameterList(
  params: OptionallyTypedIdentifier[],
  separator = strings.symbol.functionParameterSeparator
): StringifyResult {
  return params.flatMap(({ identifier, type_ }, index, array) => {
    const stringified = [String(identifier)];

    if (type_)
      stringified.push(strings.symbol.typeAnnotation, SP, String(type_));

    if (index === array.length - 1) return stringified;
    return stringified.concat(separator, SP);
  });
}

export function toSeparatedList(
  items: AstNode[],
  separator = SP,
  addSpace = false
): StringifyResult {
  return items.flatMap((item, index, array) => {
    if (index === array.length - 1) return item.stringify();
    return addSpace
      ? [...item.stringify(), separator, SP]
      : [...item.stringify(), separator];
  });
}

export abstract class Declaration extends AstNode {}
export abstract class Expression extends AstNode {}

export type Program = TopLevelNode[];
export type TopLevelNode = Comment | Declaration;
