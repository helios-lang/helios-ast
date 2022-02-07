import * as fs from 'https://deno.land/std@0.123.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

import mainModule from './modules/main_hl.ts';
import pointModule from './modules/point_hl.ts';
import attendanceModule from './modules/attendance_hl.ts';
import guessModule from './modules/guess_hl.ts';

async function main() {
  const options: ast.AstVisitorOptions = {
    stringImports: true,
    importWithFileExtension: true,
    preferTrailingSeparators: true,
    uppercaseModules: true,
    symbols: {
      // pathSeparator: '::',
    },
  };

  const modules = {
    Main: mainModule,
    Attendance: attendanceModule,
    Guess: guessModule,
    Point: pointModule,
  };

  for (const [filename, module] of Object.entries(modules)) {
    console.log('--------', `${filename}.${ast.FILE_EXTENSION}`, '--------\n');
    const stringified = ast.stringify(module, options);
    console.log(stringified, '\n');
  }

  await Promise.all(
    Object.entries(ast.htmlify(modules, options)).map(
      async ([filename, contents]) => {
        const processedFilename = filename.split('.')[0];
        const path = `./out/${processedFilename}.${ast.FILE_EXTENSION}.html`;
        await fs.ensureFile(path);
        await Deno.writeTextFile(path, contents);
        console.log('Successfully written file to', await Deno.realPath(path));
      },
    ),
  );
}

await main();
