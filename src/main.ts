import * as fs from 'https://deno.land/std@0.125.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

import attendanceModule from './modules/attendance.ts';
import guessModule from './modules/guess.ts';
import mainModule from './modules/main.ts';
import pointModule from './modules/point.ts';

async function main() {
  const options: ast.AstVisitorOptions = {
    stringImports: true,
    preferTrailingSeparators: true,
  };

  const modules = {
    main: mainModule,
    attendance: attendanceModule,
    guess: guessModule,
    point: pointModule,
  };

  for (const [filename, module] of Object.entries(modules)) {
    console.log('--------', `${filename}.${ast.FILE_EXTENSION}`, '--------\n');
    const stringified = ast.stringify(module, options);
    console.log(stringified, '\n');
  }

  await Promise.all(
    Object.entries(ast.htmlify(modules, options)).map(
      async ([filename, contents]) => {
        const processedFilename = filename.split('.')[0].toLowerCase();
        const path = `./out/${processedFilename}.${ast.FILE_EXTENSION}.html`;
        await fs.ensureFile(path);
        await Deno.writeTextFile(path, contents);
        console.log('Successfully written file to', await Deno.realPath(path));
      },
    ),
  );
}

await main();
