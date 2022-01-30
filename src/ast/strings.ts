export const NL = "\n";
export const SP = " ";
export const BEGIN = "<@@BEGIN@@>";
export const CONT = "<@@CONT@@>";
export const END = "<@@END@@>";
export const SKIP_NL = "<@@SKIP_NL@@>";
export const RESET = "<@@RESET@@>";

export const keyword = {
  function: "func",
  immutableBinding: "let",
  lambda: "\\",
  type: "type",
};

export const symbol = {
  commentStart: "##",
  commentEnd: "\n",
  functionBegin: "=",
  functionInvokeEnd: ")",
  functionInvokeStart: "(",
  functionParameterSeparator: ",",
  functionReturn: "->",
  lambdaBegin: "->",
  listSeparator: ",",
  modulePathSeparator: "::",
  recordBegin: "@(",
  recordEnd: ")",
  recordPathSeparator: ".",
  recordSeparator: ",",
  typeAnnotation: ":",
  typeBegin: "=",
  bindingOperator: "=",
};
