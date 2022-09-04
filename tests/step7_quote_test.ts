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

Deno.test(`concat function: (concat)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(concat)`, env), `()`);
});

Deno.test(`concat function: (concat (list 1 2))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(concat (list 1 2))`, env), `(1 2)`);
});

Deno.test(`concat function: (concat (list 1 2) (list 3 4))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(concat (list 1 2) (list 3 4))`, env), `(1 2 3 4)`);
});

Deno.test(`concat function: (concat (list 1 2) (list 3 4) (list 5 6))`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(concat (list 1 2) (list 3 4) (list 5 6))`, env),
    `(1 2 3 4 5 6)`,
  );
});

Deno.test(`concat function: (concat (concat))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(concat (concat))`, env), `()`);
});

Deno.test(`concat function: (concat (list) (list))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(concat (list) (list))`, env), `()`);
});

Deno.test(`concat function: (= () (concat))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= () (concat))`, env), `true`);
});

Deno.test(`concat function: (concat a b (list 5 6))`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! a (list 1 2))`, env);
  evalHelper(`(def! b (list 3 4))`, env);
  assertEquals(evalHelper(`(concat a b (list 5 6))`, env), `(1 2 3 4 5 6)`);
  assertEquals(evalHelper(`a`, env), `(1 2)`);
  assertEquals(evalHelper(`b`, env), `(3 4)`);
});

Deno.test(`regular quote: (quote 7)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quote 7)`, env), `7`);
});

Deno.test(`regular quote: (quote (1 2 3))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quote (1 2 3))`, env), `(1 2 3)`);
});

Deno.test(`regular quote: (quote (1 2 (3 4)))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quote (1 2 (3 4)))`, env), `(1 2 (3 4))`);
});

Deno.test(`regular quote: `, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
