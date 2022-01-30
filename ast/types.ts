import * as strings from "./strings.ts";

export type Program = Declaration[];

export type Identifier = string & { __identifierBrand: any };
export type Path = Identifier[];
export type Type = string & { __typeBrand: any };
export type OptionalType = Type | null;

export type Operator = "+" | "-" | "*" | "/";

export type Literal =
  | { kind: "boolean"; value: boolean }
  | { kind: "integer"; value: number }
  | { kind: "float"; value: number }
  | { kind: "string"; value: string };

export type Atom =
  | { kind: "identifier"; identifier: Identifier }
  | { kind: "literal"; literal: Literal };

type AnnotatedIdentifier = {
  identifier: Identifier;
  type_?: OptionalType;
};

export const NL = "\n";
export const SP = " ";
export const BEGIN = "<BEGIN>";
export const CONT = "<CONT>";
export const END = "<END>";
export const RESET = "<RESET>";
type StringifyResult = (false | string)[];

export const ident = (identifier: string): Identifier =>
  identifier as Identifier;

export const type = (name: string): Type => name as Type;

export const path = (head: string, ...tail: string[]): Path =>
  [head, ...tail] as Path;

export const inferType = (): null => null;

export const param = (
  identifier: string,
  type: Type | null
): AnnotatedIdentifier => ({
  identifier: ident(identifier),
  type_: type,
});

export abstract class AstNode {
  abstract stringify(): StringifyResult;
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

// -- DECLARATIONS -------------------------------------------------------------

export abstract class Declaration extends AstNode {}

export class BindingDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly type_: OptionalType,
    readonly value: Expression
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      strings.keyword.immutableBinding,
      SP,
      this.identifier,
      SP,
      "=",
      SP,
      ...this.value.stringify(),
    ];
  }
}

export class FunctionDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly parameters: AnnotatedIdentifier[],
    readonly return_: OptionalType,
    readonly body: (Declaration | Expression)[]
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      strings.keyword.function,
      SP,
      this.identifier,
      strings.symbol.functionInvokeStart,
      ...this.parameters.flatMap(({ identifier, type_ }, index, array) => {
        const stringified = [String(identifier)];

        if (type_)
          stringified.push(strings.symbol.typeAnnotation, SP, String(type_));

        if (index === array.length - 1) return stringified;
        return stringified.concat(strings.symbol.functionInvokeSeparator, SP);
      }),
      strings.symbol.functionInvokeEnd,
      SP,
      ...(this.return_
        ? [strings.symbol.functionReturn, SP, String(this.return_), SP]
        : []),
      strings.symbol.functionBegin,
      BEGIN,
      ...toSeparatedList(this.body, CONT),
      END,
    ];
  }
}

// -- EXPRESSIONS --------------------------------------------------------------

export abstract class Expression extends AstNode {}

export class IdentifierExpression extends Expression {
  constructor(readonly identifier: Identifier) {
    super();
  }

  stringify(): StringifyResult {
    return [this.identifier];
  }
}

export class LiteralExpression extends Expression {
  constructor(readonly literal: Literal) {
    super();
  }

  stringify(): StringifyResult {
    return [
      `${
        this.literal.kind === "float"
          ? this.literal.value.toFixed(1)
          : this.literal.value
      }`,
    ];
  }
}

export class CallExpression extends Expression {
  constructor(
    readonly function_: Identifier | Path,
    readonly arguments_: Expression[]
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      typeof this.function_ === "string"
        ? this.function_
        : this.function_.join(strings.symbol.modulePathSeparator),
      strings.symbol.functionInvokeStart,
      ...toSeparatedList(
        this.arguments_,
        strings.symbol.functionInvokeSeparator,
        true
      ),
      strings.symbol.functionInvokeEnd,
    ];
  }
}

export class DotExpression extends Expression {
  constructor(readonly components: (Identifier | CallExpression)[]) {
    super();
  }

  stringify(): StringifyResult {
    return this.components.flatMap((component, index, array) => {
      const stringifyComponent = () => {
        if (typeof component === "string") return String(component);
        return component.stringify();
      };

      if (index === array.length - 1) {
        return stringifyComponent();
      } else {
        return [...stringifyComponent(), strings.symbol.recordPathSeparator];
      }
    });
  }
}

export class UnaryExpression extends Expression {
  constructor(readonly operator: Operator, readonly expression: Expression) {
    super();
  }

  stringify(): StringifyResult {
    return [this.operator, ...this.expression.stringify()];
  }
}

export class BinaryExpression extends Expression {
  constructor(
    readonly operator: Operator,
    readonly lhs: Expression,
    readonly rhs: Expression
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      ...this.lhs.stringify(),
      SP,
      this.operator,
      SP,
      ...this.rhs.stringify(),
    ];
  }
}
