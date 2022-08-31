import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { makeBuiltinEnv } from "../lib/env.ts";
import { evalExpr } from "../lib/eval.ts";
import { parse } from "../lib/reader.ts";
import { tyToString } from "../lib/types.ts";

const envChain = [makeBuiltinEnv()];

function evalHelper(code: string): string {
  const ast = parse(code);
  if (!ast) {
    return "";
  }
  const res = evalExpr(ast, envChain);
  return tyToString(res, true);
}

/**
 * evaluation of arithmetic operations
 */
Deno.test("evaluation of arithmetic operations: (+ 1 2)", () => {
  const actual = evalHelper("(+ 1 2)");
  const expect = "3";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (+ 5 (* 2 3))", () => {
  const actual = evalHelper("(+ 5 (* 2 3))");
  const expect = "11";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (- (+ 5 (* 2 3)) 3)", () => {
  const actual = evalHelper("(- (+ 5 (* 2 3)) 3)");
  const expect = "8";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (/ (- (+ 5 (* 2 3)) 3) 4)", () => {
  const actual = evalHelper("(/ (- (+ 5 (* 2 3)) 3) 4)");
  const expect = "2";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (/ (- (+ 515 (* 87 311)) 302) 27)", () => {
  const actual = evalHelper("(/ (- (+ 515 (* 87 311)) 302) 27)");
  const expect = "1010";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (* -3 6)", () => {
  const actual = evalHelper("(* -3 6)");
  const expect = "-18";
  assertEquals(actual, expect);
});

Deno.test("evaluation of arithmetic operations: (/ (- (+ 515 (* -87 311)) 296) 27)", () => {
  const actual = evalHelper("(/ (- (+ 515 (* -87 311)) 296) 27)");
  const expect = "-994";
  assertEquals(actual, expect);
});
