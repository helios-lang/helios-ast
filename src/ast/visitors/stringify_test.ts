import { assertEquals } from 'https://deno.land/std@0.125.0/testing/asserts.ts';

import * as ast from '../mod.ts';
import { stringify } from './stringify.ts';

Deno.test('keyword and symbol overrides', () => {
  const program = ast.module(
    [
      new ast.ImportDeclaration(ast.path('core', 'io'), { external: true }),
      new ast.ImportDeclaration(ast.path('core', 'math'), { external: true }),
    ],
    [
      new ast.FunctionDeclaration(
        ast.ident('main'),
        [],
        null,
        new ast.BlockExpression([
          new ast.CallExpression(ast.path('io', 'println'), [
            ast.literal('Hello, world!'),
          ]),
        ]),
      ),
    ],
  );

  assertEquals(
    stringify(program, { symbols: { pathSeparator: '::' } }),
    [
      `import library core::io\n`,
      `import library core::math\n`,
      `\n`,
      `define main() =\n`,
      `  io::println("Hello, world!")`,
    ].join(''),
  );

  assertEquals(
    stringify(program, {
      symbols: { pathSeparator: '/' },
      keywords: { function: 'function', import: 'using' },
    }),
    [
      `using library core/io\n`,
      `using library core/math\n`,
      `\n`,
      `function main() =\n`,
      `  io/println("Hello, world!")`,
    ].join(''),
  );
});

Deno.test('import options', () => {
  const commonOptions: ast.AstVisitorOptions = {};

  const program = ast.module(
    [
      new ast.ImportDeclaration(ast.path('core', 'io'), { external: true }),
      new ast.ImportDeclaration(ast.path('core', 'math'), { external: true }),
    ],
    [
      new ast.FunctionDeclaration(
        ast.ident('main'),
        [],
        null,
        new ast.BlockExpression([
          new ast.CallExpression(ast.path('io', 'println'), [
            ast.literal('Hello, world!'),
          ]),
        ]),
      ),
    ],
  );

  assertEquals(
    stringify(program, commonOptions),
    [
      `import library core.io\n`,
      `import library core.math\n`,
      `\n`,
      `define main() =\n`,
      `  io.println("Hello, world!")`,
    ].join(''),
  );

  assertEquals(
    stringify(program, {
      ...commonOptions,
      stringImports: true,
    }),
    [
      `import "lib:core/io"\n`,
      `import "lib:core/math"\n`,
      `\n`,
      `define main() =\n`,
      `  io.println("Hello, world!")`,
    ].join(''),
  );

  assertEquals(
    stringify(program, {
      ...commonOptions,
      stringImports: true,
      importWithFileExtension: true,
    }),
    [
      `import "lib:core/io.he"\n`,
      `import "lib:core/math.he"\n`,
      `\n`,
      `define main() =\n`,
      `  io.println("Hello, world!")`,
    ].join(''),
  );

  assertEquals(
    stringify(program, {
      ...commonOptions,
      stringImports: true,
      uppercaseModules: true,
    }),
    [
      `import "lib:core/IO"\n`,
      `import "lib:core/Math"\n`,
      `\n`,
      `define main() =\n`,
      `  IO.println("Hello, world!")`,
    ].join(''),
  );

  assertEquals(
    stringify(program, {
      ...commonOptions,
      stringImports: true,
      importWithFileExtension: true,
      uppercaseModules: true,
    }),
    [
      `import "lib:core/IO.he"\n`,
      `import "lib:core/Math.he"\n`,
      `\n`,
      `define main() =\n`,
      `  IO.println("Hello, world!")`,
    ].join(''),
  );
});
