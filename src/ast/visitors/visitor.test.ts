import { assertEquals } from 'https://deno.land/std@0.159.0/testing/asserts.ts';

import * as common from '../common.ts';

import {
  AstVisitor,
  AstVisitorMaybeContent,
  AstVisitorNodeKind,
} from './visitor.ts';

type TestAstVisitorReturn = { kind: AstVisitorNodeKind; content: string };

class TestAstVisitor extends AstVisitor<TestAstVisitorReturn> {
  public *processModule(
    module: common.Module,
  ): Generator<TestAstVisitorReturn> {
    for (let i = 0; i < module.length; i++) {
      const topLevelNodes = module[i];
      for (const topLevelNode of topLevelNodes) {
        yield* topLevelNode.accept<TestAstVisitorReturn, this>(this);
      }
    }
  }

  protected override onYieldNode(
    kind: AstVisitorNodeKind,
    ...contents: AstVisitorMaybeContent[]
  ): TestAstVisitorReturn {
    return {
      kind,
      content: contents
        .filter((content): content is string => Boolean(content))
        .join(''),
    };
  }
}

Deno.test('Basic ASTVisitor', async (t) => {
  await t.step('construct simple module', () => {
    const module = common.module([
      common.comment('This is a comment'),
      common.ident('hello'),
    ]);

    const nodes = [...new TestAstVisitor().processModule(module)];
    assertEquals<TestAstVisitorReturn[]>(nodes, [
      { kind: 'comment', content: '# This is a comment' },
      { kind: 'identifier', content: 'hello' },
    ]);
  });
});
