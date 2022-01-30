import * as strings from "./strings.ts";
import { BEGIN, CONT, END, SKIP_NL, SP } from "./strings.ts";

import {
  Declaration,
  Expression,
  Identifier,
  OptionallyTypedIdentifier,
  OptionalType,
  StringifyResult,
  toParameterList,
  TypedIdentifier,
} from "./common.ts";

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
      strings.symbol.bindingOperator,
      SP,
      ...this.value.stringify(),
    ];
  }
}

export class FunctionDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly parameters: OptionallyTypedIdentifier[],
    readonly return_: OptionalType,
    readonly body: Expression
  ) {
    super();
  }

  stringify(): StringifyResult {
    return [
      strings.keyword.function,
      SP,
      this.identifier,
      strings.symbol.functionInvokeStart,
      ...toParameterList(this.parameters),
      strings.symbol.functionInvokeEnd,
      SP,
      ...(this.return_
        ? [strings.symbol.functionReturn, SP, String(this.return_), SP]
        : []),
      strings.symbol.functionBegin,
      ...this.body.stringify(),
    ];
  }
}

export class RecordTypeDeclaration extends Declaration {
  constructor(
    readonly identifier: Identifier,
    readonly fields?: TypedIdentifier[]
  ) {
    super();
  }

  stringifyRecord(): string[] {
    return [
      strings.symbol.recordBegin,
      ...(this.fields
        ? [
            BEGIN,
            ...this.fields.flatMap(({ identifier, type_ }, index, array) => {
              const stringified = [
                String(identifier),
                strings.symbol.typeAnnotation,
                SP,
                String(type_),
              ];
              if (index === array.length - 1) return stringified;
              return [...stringified, strings.symbol.recordSeparator, CONT];
            }),
            END,
          ]
        : []),
      strings.symbol.recordEnd,
    ];
  }

  stringify(): StringifyResult {
    return [
      strings.keyword.type,
      SP,
      String(this.identifier),
      SP,
      strings.symbol.typeBegin,
      ...(this.fields
        ? [BEGIN, ...this.stringifyRecord(), END, SKIP_NL]
        : [SP, ...this.stringifyRecord()]),
    ];
  }
}
