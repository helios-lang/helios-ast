import * as strings from "./strings.ts";

import {
  BEGIN,
  CONT,
  Declaration,
  END,
  Expression,
  Identifier,
  Literal,
  Operator,
  OptionallyTypedIdentifier,
  OptionalType,
  Path,
  SP,
  StringifyResult,
  toParameterList,
  toSeparatedList,
} from "./common.ts";

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

export class ListExpression extends Expression {
  constructor(readonly contents: Expression[]) {
    super();
  }

  stringify(): StringifyResult {
    return [
      "[",
      ...this.contents.flatMap((expr, index, array) => {
        if (index === array.length - 1) return expr.stringify();
        return [...expr.stringify(), strings.symbol.listSeparator, SP];
      }),
      "]",
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
        strings.symbol.functionParameterSeparator,
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

export class BlockExpression extends Expression {
  constructor(readonly items: (Declaration | Expression)[]) {
    super();
  }

  stringify(): StringifyResult {
    return [BEGIN, ...toSeparatedList(this.items, CONT), END];
  }
}

export class LambdaExpression extends Expression {
  constructor(
    readonly parameters: OptionallyTypedIdentifier[],
    readonly returnType: OptionalType,
    readonly body: Expression
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      strings.keyword.lambda,
      ...toParameterList(this.parameters),
      SP,
      strings.symbol.lambdaBegin,
      SP,
      ...this.body.stringify(),
    ];
  }
}
