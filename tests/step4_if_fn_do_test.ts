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

Deno.test("1-way if form: (if true (+ 1 7))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(if true (+ 1 7))", env), "8");
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

Deno.test("equality: (= 1 1)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 1 1)", env), "true");
});

Deno.test("equality: (= 0 0)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 0 0)", env), "true");
});

Deno.test("equality: (= 1 0)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 1 0)", env), "false");
});

Deno.test("equality: (= true true)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= true true)", env), "true");
});

Deno.test("equality: (= false false)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= false false)", env), "true");
});

Deno.test("equality: (= nil nil)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= nil nil)", env), "true");
});

Deno.test("equality: (= (list) (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list) (list))", env), "true");
});

Deno.test("equality: (= (list) ())", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list) ())", env), "true");
});

Deno.test("equality: (= (list 1 2) (list 1 2))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list 1 2) (list 1 2))", env), "true");
});

Deno.test("equality: (= (list 1) (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list 1) (list))", env), "false");
});

Deno.test("equality: (= (list) (list 1))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list) (list 1))", env), "false");
});

Deno.test("equality: (= 0 (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= 0 (list))", env), "false");
});

Deno.test("equality: (= (list) 0)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list) 0)", env), "false");
});

Deno.test("equality: (= (list nil) (list))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(= (list nil) (list))", env), "false");
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

Deno.test("closures: ( ( (fn* (a) (fn* (b) (+ a b))) 5) 7)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("( ( (fn* (a) (fn* (b) (+ a b))) 5) 7)", env), "12");
});

Deno.test("closures: plus5", () => {
  const env = makeEnvChain();
  evalHelper("(def! gen-plus5 (fn* () (fn* (b) (+ 5 b))))", env);
  evalHelper("(def! plus5 (gen-plus5))", env);
  assertEquals(evalHelper("(plus5 7)", env), "12");
});

Deno.test("closures: plusX", () => {
  const env = makeEnvChain();
  evalHelper("(def! gen-plusX (fn* (x) (fn* (b) (+ x b))))", env);
  evalHelper("(def! plus7 (gen-plusX 7))", env);
  assertEquals(evalHelper("(plus7 8)", env), "15");
});

Deno.test("do form: (do (prn 101))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(do (prn 101))", env), "nil");
});

Deno.test("do form: (do (prn 102) 7)", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(do (prn 102) 7)", env), "7");
});

Deno.test("do form: (do (prn 101) (prn 102) (+ 1 2))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(do (prn 101) (prn 102) (+ 1 2))", env), "3");
});

Deno.test("do form: (do (def! a 6) 7 (+ a 8))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(do (def! a 6) 7 (+ a 8))", env), "14");
  assertEquals(evalHelper("a", env), "6");
});

Deno.test("special form case-sensitivity: (def! DO (fn* (a) 7))", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(def! DO (fn* (a) 7))", env), "#<function>");
  assertEquals(evalHelper("(DO 3)", env), "7");
});

Deno.test("recursive sumdown function", () => {
  const env = makeEnvChain();
  evalHelper(
    "(def! sumdown (fn* (N) (if (> N 0) (+ N (sumdown  (- N 1))) 0)))",
    env,
  );
  assertEquals(evalHelper("(sumdown 1)", env), "1");
  assertEquals(evalHelper("(sumdown 2)", env), "3");
  assertEquals(evalHelper("(sumdown 6)", env), "21");
});

Deno.test("recursive fibonacci function", () => {
  const env = makeEnvChain();
  evalHelper(
    "(def! fib (fn* (N) (if (= N 0) 1 (if (= N 1) 1 (+ (fib (- N 1)) (fib (- N 2)))))))",
    env,
  );
  assertEquals(evalHelper("(fib 1)", env), "1");
  assertEquals(evalHelper("(fib 2)", env), "2");
  assertEquals(evalHelper("(fib 4)", env), "5");
});

Deno.test("recursive function in environment", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper("(let* (f (fn* () x) x 3) (f))", env), "3");
  assertEquals(
    evalHelper(
      "(let* (cst (fn* (n) (if (= n 0) nil (cst (- n 1))))) (cst 1))",
      env,
    ),
    "nil",
  );
  assertEquals(
    evalHelper(
      "(let* (f (fn* (n) (if (= n 0) 0 (g (- n 1)))) g (fn* (n) (f n))) (f 2))",
      env,
    ),
    "0",
  );
});

Deno.test(`if on strings: (if "" 7 8)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(if "" 7 8)`, env), "7");
});

Deno.test(`string equality: (= "abc" "abc")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "abc" "abc")`, env), "true");
});

Deno.test(`string equality: (= "abc" "")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "abc" "")`, env), "false");
});

Deno.test(`string equality: (= "" "abc")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "" "abc")`, env), "false");
});

Deno.test(`string equality: (= "abc" "def")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "abc" "def")`, env), "false");
});

Deno.test(`string equality: (= "abc" "ABC")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "abc" "ABC")`, env), "false");
});

Deno.test(`string equality: (= (list) "")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= (list) "")`, env), "false");
});

Deno.test(`string equality: (= "" (list))`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "" (list))`, env), "false");
});

Deno.test(`string equality: (= "" "")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= "" "")`, env), "true");
});
