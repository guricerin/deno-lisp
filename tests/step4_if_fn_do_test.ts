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
  assertEquals(evalHelper("(if 0 7 8)", env), "7");
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

Deno.test(`variable length arguments: ( (fn* (& more) (count more)) 1 2 3)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (& more) (count more)) 1 2 3)`, env), "3");
});

Deno.test(`variable length arguments: ( (fn* (& more) (list? more)) 1 2 3)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (& more) (list? more)) 1 2 3)`, env), "true");
});

Deno.test(`variable length arguments: ( (fn* (& more) (count more)) 1)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (& more) (count more)) 1)`, env), "1");
});

Deno.test(`variable length arguments: ( (fn* (& more) (count more)) )`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (& more) (count more)) )`, env), "0");
});

Deno.test(`variable length arguments: ( (fn* (& more) (list? more)) )`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (& more) (list? more)) )`, env), "true");
});

Deno.test(`variable length arguments: ( (fn* (a & more) (count more)) 1 2 3)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (a & more) (count more)) 1 2 3)`, env), "2");
});

Deno.test(`variable length arguments: ( (fn* (a & more) (count more)) 1)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (a & more) (count more)) 1)`, env), "0");
});

Deno.test(`variable length arguments: ( (fn* (a & more) (list? more)) 1)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`( (fn* (a & more) (list? more)) 1)`, env), "true");
});

Deno.test(`language defined not function: (not false)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not false)`, env), "true");
});

Deno.test(`language defined not function: (not nil)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not nil)`, env), "true");
});

Deno.test(`language defined not function: (not true)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not true)`, env), "false");
});

Deno.test(`language defined not function: (not "a")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not "a")`, env), "false");
});

Deno.test(`language defined not function: (not 0)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(not 0)`, env), "false");
});

Deno.test(`string quoting: ""`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`""`, env), `""`);
});

Deno.test(`string quoting: "abc"`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`"abc"`, env), `"abc"`);
});

Deno.test(`string quoting: "abc  def"`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`"abc  def"`, env), `"abc  def"`);
});

Deno.test(`string quoting: "\""`, () => {
  const env = makeEnvChain();
  const s = String.raw`"\""`;
  assertEquals(evalHelper(s, env), s);
});

Deno.test(`string quoting: "abc\\ndef\\nghi"`, () => {
  const env = makeEnvChain();
  const s = String.raw`"abc\ndef\nghi"`;
  assertEquals(evalHelper(s, env), s);
});

Deno.test(`string quoting: "abc\\def\\ghi"`, () => {
  const env = makeEnvChain();
  const s = String.raw`"abc\\def\\ghi"`;
  assertEquals(evalHelper(s, env), s);
});

Deno.test(`string quoting: "\\n"`, () => {
  const env = makeEnvChain();
  const s = String.raw`"\\n"`;
  assertEquals(evalHelper(s, env), s);
});

Deno.test(`pr-str: (pr-str)`, () => {
  const env = makeEnvChain();
  const s = String.raw`""`;
  assertEquals(evalHelper(`(pr-str)`, env), s);
});

Deno.test(`pr-str: (pr-str "")`, () => {
  const env = makeEnvChain();
  const s = String.raw`"\"\""`;
  assertEquals(evalHelper(`(pr-str "")`, env), s);
});

Deno.test(`pr-str: (pr-str "abc")`, () => {
  const env = makeEnvChain();
  const s = String.raw`"\"abc\""`;
  assertEquals(evalHelper(`(pr-str "abc")`, env), s);
});

Deno.test(`pr-str: (pr-str "abc  def" "ghi jkl")`, () => {
  const env = makeEnvChain();
  const s = String.raw`"\"abc  def\" \"ghi jkl\""`;
  assertEquals(evalHelper(`(pr-str "abc  def" "ghi jkl")`, env), s);
});

Deno.test(`pr-str: (pr-str "\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str "\"")`;
  const s = String.raw`"\"\\\"\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`pr-str: (pr-str (list 1 2 "abc" "\"") "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str (list 1 2 "abc" "\"") "def")`;
  const s = String.raw`"(1 2 \"abc\" \"\\\"\") \"def\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`pr-str: (pr-str "abc\ndef\nghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str "abc\ndef\nghi")`;
  const s = String.raw`"\"abc\\ndef\\nghi\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`pr-str: (pr-str "abc\\def\\ghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str "abc\\def\\ghi")`;
  const s = String.raw`"\"abc\\\\def\\\\ghi\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`pr-str: (pr-str (list))`, () => {
  const env = makeEnvChain();
  const s = String.raw`"()"`;
  assertEquals(evalHelper(`(pr-str (list))`, env), s);
});

Deno.test(`str: (str)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str)`;
  const s = String.raw`""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "")`;
  const s = String.raw`""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "abc")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "abc")`;
  const s = String.raw`"abc"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "\"")`;
  const s = String.raw`"\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str 1 "abc" 3)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str 1 "abc" 3)`;
  const s = String.raw`"1abc3"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "abc  def" "ghi jkl")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "abc  def" "ghi jkl")`;
  const s = String.raw`"abc  defghi jkl"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "abc\ndef\nghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "abc\ndef\nghi")`;
  const s = String.raw`"abc\ndef\nghi"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str "abc\\def\\ghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str "abc\\def\\ghi")`;
  const s = String.raw`"abc\\def\\ghi"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str (list 1 2 "abc" "\"") "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str (list 1 2 "abc" "\"") "def")`;
  const s = String.raw`"(1 2 abc \")def"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`str: (str (list))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str (list))`;
  const s = String.raw`"()"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`prn: (prn)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn)`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "abc")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "abc")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "abc  def" "ghi jkl")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "abc  def" "ghi jkl")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "\"")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "abc\ndef\nghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "abc\ndef\nghi")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn "abc\\def\\ghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn "abc\\def\\ghi")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`prn: (prn (list 1 2 "abc" "\"") "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(prn (list 1 2 "abc" "\"") "def")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println)`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "abc")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "abc")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "abc  def" "ghi jkl")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "abc  def" "ghi jkl")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "\"")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "abc\ndef\nghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "abc\ndef\nghi")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println "abc\\def\\ghi")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println "abc\\def\\ghi")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`println: (println (list 1 2 "abc" "\"") "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(println (list 1 2 "abc" "\"") "def")`;
  assertEquals(evalHelper(t, env), "nil");
});

Deno.test(`keywords: (= :abc :abc)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= :abc :abc)`;
  assertEquals(evalHelper(t, env), "true");
});

Deno.test(`keywords: (= :abc :def)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= :abc :def)`;
  assertEquals(evalHelper(t, env), "false");
});

Deno.test(`keywords: (= :abc ":abc")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= :abc ":abc")`;
  assertEquals(evalHelper(t, env), "false");
});

Deno.test(`keywords: (= (list :abc) (list :abc))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= (list :abc) (list :abc))`;
  assertEquals(evalHelper(t, env), "true");
});

Deno.test(`vector truthiness: (if [] 7 8)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(if [] 7 8)`;
  assertEquals(evalHelper(t, env), "7");
});

Deno.test(`vector printing: (pr-str [1 2 "abc" "\""] "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str [1 2 "abc" "\""] "def")`;
  const s = String.raw`"[1 2 \"abc\" \"\\\"\"] \"def\""`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector printing: (pr-str [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(pr-str [])`;
  const s = String.raw`"[]"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector printing: (str [1 2 "abc" "\""] "def")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str [1 2 "abc" "\""] "def")`;
  const s = String.raw`"[1 2 abc \"]def"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector printing: (str [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(str [])`;
  const s = String.raw`"[]"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector functions: (count [1 2 3])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(count [1 2 3])`;
  const s = String.raw`3`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector functions: (empty? [1 2 3])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(empty? [1 2 3])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector functions: (empty? [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(empty? [])`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector functions: (list? [4 5 6])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(list? [4 5 6])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [] (list))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [] (list))`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [7 8] [7 8])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [7 8] [7 8])`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [:abc] [:abc])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [:abc] [:abc])`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= (list 1 2) [1 2])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= (list 1 2) [1 2])`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= (list 1) [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= (list 1) [])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [] [1])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [] [1])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= 0 [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= 0 [])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [] 0)`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [] 0)`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= [] "")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [] "")`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector equality: (= "" [])`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= "" [])`;
  const s = String.raw`false`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector parameter lists: ( (fn* [] 4) )`, () => {
  const env = makeEnvChain();
  const t = String.raw`( (fn* [] 4) )`;
  const s = String.raw`4`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`vector parameter lists: ( (fn* [f x] (f x)) (fn* [a] (+ 1 a)) 7)`, () => {
  const env = makeEnvChain();
  const t = String.raw`( (fn* [f x] (f x)) (fn* [a] (+ 1 a)) 7)`;
  const s = String.raw`8`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`Nested vector/list equality: (= [(list)] (list []))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [(list)] (list []))`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`Nested vector/list equality: (= [1 2 (list 3 4 [5 6])] (list 1 2 [3 4 (list 5 6)]))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(= [1 2 (list 3 4 [5 6])] (list 1 2 [3 4 (list 5 6)]))`;
  const s = String.raw`true`;
  assertEquals(evalHelper(t, env), s);
});
