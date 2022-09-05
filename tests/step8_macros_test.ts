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

Deno.test(`trivial macros`, () => {
  const env = makeEnvChain();
  evalHelper(`(defmacro! one (fn* () 1))`, env);
  assertEquals(evalHelper(`(one)`, env), `1`);
  evalHelper(`(defmacro! two (fn* () 2))`, env);
  assertEquals(evalHelper(`(two)`, env), `2`);
});

Deno.test(`unless macros`, () => {
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

Deno.test(`macroexpand`, () => {
  const env = makeEnvChain();
  evalHelper(`(defmacro! one (fn* () 1))`, env);
  assertEquals(evalHelper(`(macroexpand (one))`, env), `1`);
  evalHelper("(defmacro! unless (fn* (pred a b) `(if ~pred ~b ~a)))", env);
  assertEquals(
    evalHelper(`(macroexpand (unless PRED A B))`, env),
    `(if PRED B A)`,
  );
  evalHelper(
    "(defmacro! unless2 (fn* (pred a b) (list 'if (list 'not pred) a b)))",
    env,
  );
  assertEquals(
    evalHelper(`(macroexpand (unless2 PRED A B))`, env),
    `(if (not PRED) A B)`,
  );
  assertEquals(
    evalHelper(`(macroexpand (unless2 2 3 4))`, env),
    `(if (not 2) 3 4)`,
  );
});

Deno.test(`evaluation of macro result`, () => {
  const env = makeEnvChain();
  evalHelper(`(defmacro! identity (fn* (x) x))`, env);
  assertEquals(
    evalHelper(`(let* (a 123) (macroexpand (identity a)))`, env),
    `a`,
  );
  assertEquals(evalHelper(`(let* (a 123) (identity a))`, env), `123`);
});

Deno.test(`macros do not break empty list`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`()`, env), `()`);
});

Deno.test(`macros do not break quasiquote`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("`(1)", env), `(1)`);
});

Deno.test(`non-macro function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not (= 1 1))`, env), `false`);
  assertEquals(evalHelper(`(not (= 1 2))`, env), `true`);
});

Deno.test(`nth, first and rest functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(nth (list 1) 0)`, env), `1`);
  assertEquals(evalHelper(`(nth (list 1 2) 1)`, env), `2`);
  assertEquals(evalHelper(`(nth (list 1 2 nil) 2)`, env), `nil`);
  evalHelper(`(def! x "x")`, env);
  // assertThrows(() => {
  //   evalHelper(`(def! x (nth (list 1 2) 2))`, env);
  // });
  assertEquals(evalHelper(`x`, env), `"x"`);

  assertEquals(evalHelper(`(first (list))`, env), `nil`);
  assertEquals(evalHelper(`(first (list 6))`, env), `6`);
  assertEquals(evalHelper(`(first (list 7 8 9))`, env), `7`);
  assertEquals(evalHelper(`(rest (list))`, env), `()`);
  assertEquals(evalHelper(`(rest (list 6))`, env), `()`);
  assertEquals(evalHelper(`(rest (list 7 8 9))`, env), `(8 9)`);
});

Deno.test(`cond macro`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(macroexpand (cond))`, env), `nil`);
  assertEquals(evalHelper(`(cond)`, env), `nil`);
  assertEquals(evalHelper(`(macroexpand (cond X Y))`, env), `(if X Y (cond))`);
  assertEquals(evalHelper(`(cond true 7)`, env), `7`);
  assertEquals(evalHelper(`(cond false 7)`, env), `7`);
  assertEquals(
    evalHelper(`(macroexpand (cond X Y Z T))`, env),
    `(if X Y (cond Z T))`,
  );
  assertEquals(evalHelper(`(cond true 7 true 8)`, env), `7`);
  assertEquals(evalHelper(`(cond false 7 true 8)`, env), `8`);
  assertEquals(evalHelper(`(cond false 7 false 8 "else" 9)`, env), `9`);
  assertEquals(evalHelper(`(cond false 7 (= 2 2) 8 "else" 9)`, env), `8`);
  assertEquals(evalHelper(`(cond false 7 false 8 false 9)`, env), `nil`);
});

Deno.test(`EVAL in let*`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(let* (x (cond false "no" true "yes")) x)`, env),
    `"yes"`,
  );
});

Deno.test(`nth, first, rest with vectors`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(nth [1] 0)`, env), `1`);
  assertEquals(evalHelper(`(nth [1 2] 1)`, env), `2`);
  assertEquals(evalHelper(`(nth [1 2 nil] 2)`, env), `nil`);
  evalHelper(`(def! x "x")`, env);
  // assertThrows(() => {
  //   evalHelper(`(def! x (nth [1 2] 2))`, env);
  // });
  assertEquals(evalHelper(`x`, env), `"x"`);

  assertEquals(evalHelper(`(first [])`, env), `nil`);
  assertEquals(evalHelper(`(first nil)`, env), `nil`);
  assertEquals(evalHelper(`(first [10])`, env), `10`);
  assertEquals(evalHelper(`(first [10 11 12])`, env), `10`);
  assertEquals(evalHelper(`(rest [])`, env), `()`);
  assertEquals(evalHelper(`(rest nil)`, env), `()`);
  assertEquals(evalHelper(`(rest [10])`, env), `()`);
  assertEquals(evalHelper(`(rest [10 11 12])`, env), `(11 12)`);
  assertEquals(evalHelper(`(rest (cons 10 [11 12]))`, env), `(11 12)`);
});

Deno.test(`EVAL in vector let*`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(let* [x (cond false "no" true "yes")] x)`, env),
    `"yes"`,
  );
});

Deno.test(`macros use closures`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! x 2)`, env);
  evalHelper(`(defmacro! a (fn* [] x))`, env);
  assertEquals(evalHelper(`(a)`, env), `2`);
  assertEquals(evalHelper(`(let* (x 3) (a))`, env), `2`);
});
