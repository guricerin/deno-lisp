import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { makeBuiltinEnv } from "../lib/env.ts";
import { evalAst } from "../lib/eval.ts";
import { parse } from "../lib/reader.ts";
import { EnvChain, tyToString } from "../lib/types.ts";

function makeEnvChain() {
  return [makeBuiltinEnv()];
}

function evalHelper(code: string, envChain: EnvChain): string {
  const ast = parse(code);
  if (!ast) {
    return "";
  }
  const res = evalAst(ast, envChain);
  return tyToString(res, true);
}

/**
 * evaluation of arithmetic operations
 */
Deno.test("evaluation of arithmetic operations: (+ 1 2)", () => {
  const env = makeEnvChain();
  const actual = evalHelper("(+ 1 2)", env);
  assertEquals(actual, "3");
});

Deno.test("evaluation of arithmetic operations: (+ 5 (* 2 3))", () => {
  const env = makeEnvChain();
  const actual = evalHelper("(+ 5 (* 2 3))", env);
  assertEquals(actual, "11");
});

/**
 * testing def!
 */
Deno.test("testing def!: (def! x 3)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! x 3)", env), "3");
  assertEquals(evalHelper("x", env), "3");
});

Deno.test("testing def!: (def! y (+ 1 7))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! y (+ 1 7))", env), "8");
  assertEquals(evalHelper("y", env), "8");
});

Deno.test("Verifying symbols are case-sensitive: (def! mynum 111)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! mynum 111)", env), "111");
  assertEquals(evalHelper("(def! MYNUM 222)", env), "222");
  assertEquals(evalHelper("mynum", env), "111");
  assertEquals(evalHelper("MYNUM", env), "222");
});

/**
 * Check env lookup non-fatal error
 */
Deno.test("Check env lookup non-fatal error", () => {
  const env = makeEnvChain();
  assertThrows(() => {
    evalHelper("(abc 1 2 3)", env);
  });
  assertEquals(evalHelper("(def! w 123)", env), "123");
  assertThrows(() => {
    evalHelper("(def! w (abc))", env);
  });
  assertEquals(evalHelper("w", env), "123");
});
