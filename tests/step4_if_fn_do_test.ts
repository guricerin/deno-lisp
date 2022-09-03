import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { makeBuiltinEnv } from "../lib/core.ts";
import { evalAst } from "../lib/eval.ts";
import { parse } from "../lib/reader.ts";
import { EnvChain } from "../lib/types.ts";
import { tyToString } from "../lib/types_utils.ts";

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

Deno.test("list functions: (list)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(list)", env), "()");
});

Deno.test("list functions: (list? (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(list? (list))", env), "true");
});

Deno.test("list functions: (empty? (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(empty? (list))", env), "true");
});

Deno.test("list functions: (empty? (list 1))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(empty? (list 1))", env), "false");
});

Deno.test("list functions: (list 1 2 3)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(list 1 2 3)", env), "(1 2 3)");
});

Deno.test("list functions: (count (list 1 2 3))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(count (list 1 2 3))", env), "3");
});

Deno.test("list functions: (count (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(count (list))", env), "0");
});

Deno.test("list functions: (count nil)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(count nil)", env), "0");
});

Deno.test("list functions: (if (> (count (list 1 2 3)) 3) 89 78)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if (> (count (list 1 2 3)) 3) 89 78)", env), "78");
});

Deno.test("list functions: (if (>= (count (list 1 2 3)) 3) 89 78)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if (>= (count (list 1 2 3)) 3) 89 78)", env), "89");
});

Deno.test("if form: (if true 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if true 7 8)", env), "7");
});

Deno.test("if form: (if false 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if false 7 8)", env), "8");
});

Deno.test("if form: (if false 7 false)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if false 7 false)", env), "false");
});

Deno.test("if form: (if true (+ 1 7) (+ 1 8))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if true (+ 1 7) (+ 1 8))", env), "8");
});

Deno.test("if form: (if false (+ 1 7) (+ 1 8))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if false (+ 1 7) (+ 1 8))", env), "9");
});

Deno.test("if form: (if nil 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if nil 7 8)", env), "8");
});

Deno.test("if form: (if 0 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if 0 7 8)", env), "8");
});

Deno.test("if form: (if (list) 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if (list) 7 8)", env), "7");
});

Deno.test("if form: (if (list 1 2 3) 7 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if (list 1 2 3) 7 8)", env), "7");
});

Deno.test("if form: (= (list) nil)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list) nil)", env), "false");
});

Deno.test("1-way if form: (if false (+ 1 7))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if false (+ 1 7))", env), "nil");
});

Deno.test("1-way if form: (if nil 8)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if nil 8)", env), "nil");
});

Deno.test("1-way if form: (if nil 8 7)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if nil 8 7)", env), "7");
});

Deno.test("basic conditionals: (= 2 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 2 1)", env), "false");
});

Deno.test("basic conditionals: (= 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 1 1)", env), "true");
});

Deno.test("basic conditionals: (= 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 1 2)", env), "false");
});

Deno.test("basic conditionals: (= 1 (+ 1 1))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 1 (+ 1 1))", env), "false");
});

Deno.test("basic conditionals: (= 2 (+ 1 1))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 2 (+ 1 1))", env), "true");
});

Deno.test("basic conditionals: (= nil 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= nil 1)", env), "false");
});

Deno.test("basic conditionals: (= nil nil)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= nil nil)", env), "true");
});

Deno.test("basic conditionals: (> 2 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(> 2 1)", env), "true");
});

Deno.test("basic conditionals: (> 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(> 1 1)", env), "false");
});

Deno.test("basic conditionals: (> 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(> 1 2)", env), "false");
});

Deno.test("basic conditionals: (>= 2 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(>= 2 1)", env), "true");
});

Deno.test("basic conditionals: (>= 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(>= 1 1)", env), "true");
});

Deno.test("basic conditionals: (>= 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(>= 1 2)", env), "false");
});

Deno.test("basic conditionals: (< 2 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(< 2 1)", env), "false");
});

Deno.test("basic conditionals: (< 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(< 1 1)", env), "false");
});

Deno.test("basic conditionals: (< 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(< 1 2)", env), "true");
});

Deno.test("basic conditionals: (<= 2 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(<= 2 1)", env), "false");
});

Deno.test("basic conditionals: (<= 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(<= 1 1)", env), "true");
});

Deno.test("basic conditionals: (<= 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(<= 1 2)", env), "true");
});

Deno.test("1-way if form: (if true (+ 1 7))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if true (+ 1 7))", env), "8");
});

Deno.test("builtin and user defined functions: (+ 1 2)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(+ 1 2)", env), "3");
});

Deno.test("builtin and user defined functions: ( (fn* (a b) (+ b a)) 3 4)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("( (fn* (a b) (+ b a)) 3 4)", env), "7");
});

Deno.test("builtin and user defined functions: ( (fn* () 4) )", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("( (fn* () 4) )", env), "4");
});

Deno.test("builtin and user defined functions: ( (fn* (f x) (f x)) (fn* (a) (+ 1 a)) 7)", () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper("( (fn* (f x) (f x)) (fn* (a) (+ 1 a)) 7)", env),
    "8",
  );
});
