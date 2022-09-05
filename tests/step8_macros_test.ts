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

Deno.test(`trivial macros`, () => {
  const env = makeEnvChain();
  evalHelper(`(defmacro! one (fn* () 1))`, env);
  assertEquals(evalHelper(`(one)`, env), `1`);
  evalHelper(`(defmacro! two (fn* () 2))`, env);
  assertEquals(evalHelper(`(two)`, env), `2`);
});

Deno.test(`trivial macros`, () => {
  const env = makeEnvChain();
  evalHelper("(defmacro! unless (fn* (pred a b) `(if ~pred ~b ~a)))", env);
  assertEquals(evalHelper(`(unless false 7 8)`, env), `7`);
  assertEquals(evalHelper(`(unless true 7 8)`, env), `8`);
  evalHelper(
    "(defmacro! unless2 (fn* (pred a b) (list 'if (list 'not pred) a b)))",
    env,
  );
  assertEquals(evalHelper(`(unless2 false 7 8)`, env), `7`);
  assertEquals(evalHelper(`(unless2 true 7 8)`, env), `8`);
});

Deno.test(`unless macros`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
