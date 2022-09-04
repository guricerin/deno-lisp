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

Deno.test(`simple quasiquote: (quasiquote nil)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote nil)`, env), `nil`);
});

Deno.test(`simple quasiquote: (quasiquote 7)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote 7)`, env), `7`);
});

Deno.test(`simple quasiquote: (quasiquote a)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote a)`, env), `a`);
});

Deno.test(`simple quasiquote: (quasiquote {"a" b})`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote {"a" b})`, env), `{"a" b}`);
});

Deno.test(`quasiquote with lists: (quasiquote ())`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote ())`, env), `()`);
});

Deno.test(`quasiquote with lists: (quasiquote (1 2 3))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (1 2 3))`, env), `(1 2 3)`);
});

Deno.test(`quasiquote with lists: (quasiquote (a))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (a))`, env), `(a)`);
});

Deno.test(`quasiquote with lists: (quasiquote (1 2 (3 4)))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (1 2 (3 4)))`, env), `(1 2 (3 4))`);
});

Deno.test(`quasiquote with lists: (quasiquote (nil))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (nil))`, env), `(nil)`);
});

Deno.test(`quasiquote with lists: (quasiquote (1 ()))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (1 ()))`, env), `(1 ())`);
});

Deno.test(`quasiquote with lists: (quasiquote (() 1))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (() 1))`, env), `(() 1)`);
});

Deno.test(`quasiquote with lists: (quasiquote (1 () 2))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (1 () 2))`, env), `(1 () 2)`);
});

Deno.test(`quasiquote with lists: (quasiquote (()))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (()))`, env), `(())`);
});

Deno.test(`quasiquote with lists: `, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`unquote: (quasiquote (unquote 7))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(quasiquote (unquote 7))`, env), `7`);
});

Deno.test(`unquote: (def! a 8)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! a 8)`, env), `8`);
  assertEquals(evalHelper(`(quasiquote a)`, env), `a`);
  assertEquals(evalHelper(`(quasiquote (unquote a))`, env), `8`);
  assertEquals(evalHelper(`(quasiquote (1 a 3))`, env), `(1 a 3)`);
  assertEquals(evalHelper(`(quasiquote (1 (unquote a) 3))`, env), `(1 8 3)`);
});

Deno.test(`unquote: (def! b (quote (1 "b" "d")))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! b (quote (1 "b" "d")))`, env), `(1 "b" "d")`);
  assertEquals(evalHelper(`(quasiquote (1 b 3))`, env), `(1 b 3)`);
  assertEquals(
    evalHelper(`(quasiquote (1 (unquote b) 3))`, env),
    `(1 (1 "b" "d") 3)`,
  );
  assertEquals(
    evalHelper(`(quasiquote ((unquote 1) (unquote 2)))`, env),
    `(1 2)`,
  );
});

Deno.test(`Quasiquote and environments`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(let* (x 0) (quasiquote (unquote x)))`, env), `0`);
});

Deno.test(`splice-unquote`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! c (quote (1 "b" "d")))`, env), `(1 "b" "d")`);
  assertEquals(evalHelper(`(quasiquote (1 c 3))`, env), `(1 c 3)`);
  assertEquals(
    evalHelper(`(quasiquote (1 (splice-unquote c) 3))`, env),
    `(1 1 "b" "d" 3)`,
  );
  assertEquals(
    evalHelper(`(quasiquote (1 (splice-unquote c)))`, env),
    `(1 1 "b" "d")`,
  );
  assertEquals(
    evalHelper(`(quasiquote ((splice-unquote c) 2))`, env),
    `(1 "b" "d" 2)`,
  );
  assertEquals(
    evalHelper(`(quasiquote ((splice-unquote c) (splice-unquote c)))`, env),
    `(1 "b" "d" 1 "b" "d")`,
  );
});

Deno.test(`symbol equality`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= (quote abc) (quote abc))`, env), `true`);
  assertEquals(evalHelper(`(= (quote abc) (quote abcd))`, env), `false`);
  assertEquals(evalHelper(`(= (quote abc) "abc")`, env), `false`);
  assertEquals(evalHelper(`(= "abc" (quote abc))`, env), `false`);
  assertEquals(evalHelper(`(= "abc" (str (quote abc)))`, env), `true`);
  assertEquals(evalHelper(`(= (quote abc) nil)`, env), `false`);
  assertEquals(evalHelper(`(= nil (quote abc))`, env), `false`);
});

Deno.test(`' (quote) reader macro`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`'7`, env), `7`);
  assertEquals(evalHelper(`'(1 2 3)`, env), `(1 2 3)`);
  assertEquals(evalHelper(`'(1 2 (3 4))`, env), `(1 2 (3 4))`);
});

Deno.test(`cons and concat with vectors`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(cons 1 [])`, env), `(1)`);
  assertEquals(evalHelper(`(cons [1] [2 3])`, env), `([1] 2 3)`);
  assertEquals(evalHelper(`(cons 1 [2 3])`, env), `(1 2 3)`);
  assertEquals(
    evalHelper(`(concat [1 2] (list 3 4) [5 6])`, env),
    `(1 2 3 4 5 6)`,
  );
  assertEquals(evalHelper(`(concat [1 2])`, env), `(1 2)`);
});

Deno.test(`vec function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(vec (list))`, env), `[]`);
  assertEquals(evalHelper(`(vec (list 1))`, env), `[1]`);
  assertEquals(evalHelper(`(vec (list 1 2))`, env), `[1 2]`);
  assertEquals(evalHelper(`(vec [])`, env), `[]`);
  assertEquals(evalHelper(`(vec [1 2])`, env), `[1 2]`);
});

Deno.test(`vec does not mutate the original list`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! a (list 1 2))`, env);
  assertEquals(evalHelper(`(vec a)`, env), `[1 2]`);
  assertEquals(evalHelper(`a`, env), `(1 2)`);
});

Deno.test(`quine`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(
      `((fn* (q) (quasiquote ((unquote q) (quote (unquote q))))) (quote (fn* (q) (quasiquote ((unquote q) (quote (unquote q)))))))`,
      env,
    ),
    `((fn* (q) (quasiquote ((unquote q) (quote (unquote q))))) (quote (fn* (q) (quasiquote ((unquote q) (quote (unquote q)))))))`,
  );
});

Deno.test(`unquote with vectors`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! a 8)", env), `8`);
  assertEquals(evalHelper("`[~a]", env), `[8]`);
  assertEquals(evalHelper("`[(~a)]", env), `[(8)]`);
  assertEquals(evalHelper("`([~a])", env), `([8])`);
  assertEquals(evalHelper("`[a ~a a]", env), `[a 8 a]`);
  assertEquals(evalHelper("`([a ~a a])", env), `([a 8 a])`);
  assertEquals(evalHelper("`[(a ~a a)]", env), `[(a 8 a)]`);
});

Deno.test(`splice-unquote with vectors`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! c '(1 "b" "d"))`, env), `(1 "b" "d")`);
  assertEquals(evalHelper("`[~@c]", env), `[1 "b" "d"]`);
  assertEquals(evalHelper("`[(~@c)]", env), `[(1 "b" "d")]`);
  assertEquals(evalHelper("`([~@c])", env), `([1 "b" "d"])`);
  assertEquals(evalHelper("`[1 ~@c 3]", env), `[1 1 "b" "d" 3]`);
  assertEquals(evalHelper("`([1 ~@c 3])", env), `([1 1 "b" "d" 3])`);
  assertEquals(evalHelper("`[(1 ~@c 3)]", env), `[(1 1 "b" "d" 3)]`);
});

Deno.test(`unquote: `, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
