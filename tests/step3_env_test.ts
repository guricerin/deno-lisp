import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
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

Deno.test("def!: (def! x 3)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! x 3)", env), "3");
  assertEquals(evalHelper("x", env), "3");
});

Deno.test("def!: (def! y (+ 1 7))", () => {
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

Deno.test("let*", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! x 4)", env), "4");
  assertEquals(evalHelper("(let* (z 9) z)", env), "9");
  assertEquals(evalHelper("(let* (x 9) x)", env), "9");
  assertEquals(evalHelper("x", env), "4");
  assertEquals(evalHelper("(let* (z (+ 2 3)) (+ 1 z))", env), "6");
  assertEquals(evalHelper("(let* (p (+ 2 3) q (+ 2 p)) (+ p q))", env), "12");
  assertEquals(evalHelper("(def! y (let* (z 7) z))", env), "7");
  assertEquals(evalHelper("y", env), "7");
});

Deno.test("outer environment", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! a 4)", env), "4");
  assertEquals(evalHelper("(let* (q 9) q)", env), "9");
  assertEquals(evalHelper("(let* (q 9) a)", env), "4");
  assertEquals(evalHelper("(let* (z 2) (let* (q 9) a))", env), "4");
});

Deno.test("let* with vector bindings", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(let* [z 9] z)", env), "9");
  assertEquals(evalHelper("(let* [p (+ 2 3) q (+ 2 p)] (+ p q))", env), "12");
});

Deno.test("vector evaluation", () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper("(let* (a 5 b 6) [3 4 a [b 7] 8])", env),
    "[3 4 5 [6 7] 8]",
  );
});

Deno.test("last assignment takes priority", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(let* (x 2 x 3) x)", env), "3");
});
