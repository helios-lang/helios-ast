import * as fs from 'https://deno.land/std@0.159.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

import attendanceModule from './inputs/attendance.ts';
import guessModule from './inputs/guess.ts';
import mainModule from './inputs/main.ts';
import pointModule from './inputs/point.ts';

async function main() {
  const _options: ast.AstVisitorOptions = {
    importWithFileExtension: true,
    preferTrailingSeparators: true,
    stringImports: true,
    uppercaseModules: true,
  };

  const _modules = {
    main: mainModule,
    attendance: attendanceModule,
    guess: guessModule,
    point: pointModule,
  };

  await new Promise<void>((resolve) => resolve());
}

await main();
