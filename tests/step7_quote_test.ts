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

Deno.test(`cons function: (cons 1 (list))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(cons 1 (list))`, env), `(1)`);
});

Deno.test(`cons function: (cons 1 (list 2))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(cons 1 (list 2))`, env), `(1 2)`);
});

Deno.test(`cons function: (cons 1 (list 2 3))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(cons 1 (list 2 3))`, env), `(1 2 3)`);
});

Deno.test(`cons function: (cons (list 1) (list 2 3))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(cons (list 1) (list 2 3))`, env), `((1) 2 3)`);
});

Deno.test(`cons function: (def! a (list 2 3))`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! a (list 2 3))`, env);
  assertEquals(evalHelper(`(cons 1 a)`, env), `(1 2 3)`);
  assertEquals(evalHelper(`a`, env), `(2 3)`);
});

Deno.test(`cons function: `, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
