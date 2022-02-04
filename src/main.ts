import * as fs from 'https://deno.land/std@0.123.0/fs/mod.ts';

import * as ast from './ast/mod.ts';
import mainModule from './modules/main_hl.ts';
import attendanceModule from './modules/attendance_hl.ts';
import pointModule from './modules/point_hl.ts';

async function main() {
  const options: ast.AstVisitorOptions = {
    stringImports: true,
    // importWithFileExtension: true,
    preferTrailingSeparators: true,
    symbols: {
      // pathSeparator: '::',
    },
  };

  const stringified = ast.stringify(attendanceModule, options);
  console.log(stringified, '\n');

  const htmlified = ast.htmlify(
    { main: mainModule, attendance: attendanceModule, point: pointModule },
    options,
  );

  await Promise.all(
    Object.entries(htmlified).map(async ([fileName, contents]) => {
      const filePath = `./out/${fileName}.hl.html`;
      await fs.ensureFile(filePath);
      await Deno.writeTextFile(filePath, contents);
      console.log(
        'Successfully written file to',
        await Deno.realPath(filePath),
      );
    }),
  );
}

await main();
