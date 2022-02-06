import * as fs from 'https://deno.land/std@0.123.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

import mainModule from './modules/main_hl.ts';
import pointModule from './modules/point_hl.ts';
import attendanceModule from './modules/attendance_hl.ts';
import guessModule from './modules/guess_hl.ts';

async function main() {
  const options: ast.AstVisitorOptions = {
    stringImports: true,
    // importWithFileExtension: true,
    preferTrailingSeparators: true,
    symbols: {
      // pathSeparator: '::',
    },
  };

  const modules = {
    main: mainModule,
    point: pointModule,
    attendance: attendanceModule,
    guess: guessModule,
  };

  for (const [filename, module] of Object.entries(modules)) {
    console.log('--------', `${filename}.hl`, '--------\n');
    const stringified = ast.stringify(module, options);
    console.log(stringified, '\n');
  }

  await Promise.all(
    Object.entries(ast.htmlify(modules, options)).map(
      async ([filename, contents]) => {
        const path = `./out/${filename}.hl.html`;
        await fs.ensureFile(path);
        await Deno.writeTextFile(path, contents);
        console.log('Successfully written file to', await Deno.realPath(path));
      },
    ),
  );
}

await main();
