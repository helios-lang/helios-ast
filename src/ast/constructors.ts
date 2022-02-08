import {
  AlwaysTypedIdentifier,
  CommentNode,
  GenericsListNode,
  Identifier,
  IdentifierNode,
  MaybeTypedIdentifier,
  Module,
  PathNode,
  PlaceHolderNode,
  TopLevelNode,
  TypeIdentifierNode,
  TypeNode,
  TypeNodeChild,
  TypeNodeOrNull,
} from './common.ts';

export const placeholder = () => new PlaceHolderNode();

export const module = (...nodes: TopLevelNode[][]): Module => nodes;

export const comment = (...contents: string[]): CommentNode =>
  new CommentNode(contents.join('\n'));

export const docComment = (...contents: string[]): CommentNode =>
  new CommentNode(contents.join('\n'), true);

export const ident = (identifier: string): IdentifierNode =>
  new IdentifierNode(identifier as Identifier);

export const typeIdent = (
  identifier: string,
  generics?: string[],
): TypeIdentifierNode =>
  new TypeIdentifierNode(
    identifier as Identifier,
    generics
      ? new GenericsListNode(generics.map((item) => typeIdent(item)))
      : undefined,
  );

export const path = (head: string, ...tail: string[]): PathNode =>
  new PathNode([head, ...tail].map(ident));

export function type(child: TypeNodeChild): TypeNode {
  return new TypeNode(child);
}

export const inferredType = (): TypeNodeOrNull => null;

export function identWithType(
  identifier: string,
  child: TypeNodeChild,
): AlwaysTypedIdentifier {
  return { identifier: ident(identifier), suffix: type(child) };
}

export function identWithOptType(
  identifier: string,
  child: TypeNodeChild | null = null,
): MaybeTypedIdentifier {
  return {
    identifier: ident(identifier),
    suffix: child ? type(child) : null,
  };
}
