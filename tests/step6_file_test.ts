import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { initEnvChain } from "../lib/core.ts";
import { evalAst } from "../lib/eval.ts";
import { parse } from "../lib/reader.ts";
import { EnvChain } from "../lib/types.ts";
import { tyToString } from "../lib/types_utils.ts";

function makeEnvChain() {
  return initEnvChain();
}

function evalHelper(code: string, envChain: EnvChain): string {
  const ast = parse(code);
  if (!ast) {
    return "";
  }
  const res = evalAst(ast, envChain);
  return tyToString(res, true);
}

Deno.test("(do (do)) not broken by TCO", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(do (do 1 2))`, env), `2`);
});

Deno.test('read-string, eval and slurp: (read-string "(1 2 (3 4) nil)")', () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(read-string "(1 2 (3 4) nil)")`, env),
    `(1 2 (3 4) nil)`,
  );
});

Deno.test('read-string, eval and slurp: (= nil (read-string "nil"))', () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= nil (read-string "nil"))`, env), `true`);
});

Deno.test('read-string, eval and slurp: (read-string "(+ 2 3)")', () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(read-string "(+ 2 3)")`, env), `(+ 2 3)`);
});

Deno.test(`read-string, eval and slurp: (read-string "\"\n\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(read-string "\"\n\"")`;
  const s = String.raw`"\n"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`read-string, eval and slurp: (read-string "7 ;; comment")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(read-string "7 ;; comment")`, env), `7`);
});

Deno.test(`Differing output, but make sure no fatal error`, () => {
  const env = makeEnvChain();
  const t = String.raw`(read-string ";; comment")`;
  const s = String.raw`nil`;
  assertEquals(evalHelper(t, env), s);
});
