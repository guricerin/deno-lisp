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

Deno.test("(do (do)) not broken by TCO", () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(do (do 1 2))`, env), `2`);
});

Deno.test('read-string, eval and slurp: (read-string "(1 2 (3 4) nil)")', () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(read-string "(1 2 (3 4) nil)")`, env),
    `(1 2 (3 4) nil)`,
  );
});

Deno.test('read-string, eval and slurp: (= nil (read-string "nil"))', () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(= nil (read-string "nil"))`, env), `true`);
});

Deno.test('read-string, eval and slurp: (read-string "(+ 2 3)")', () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(read-string "(+ 2 3)")`, env), `(+ 2 3)`);
});

Deno.test(`read-string, eval and slurp: (read-string "\"\n\"")`, () => {
  const env = makeEnvChain();
  const t = String.raw`(read-string "\"\n\"")`;
  const s = String.raw`"\n"`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`read-string, eval and slurp: (read-string "7 ;; comment")`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(read-string "7 ;; comment")`, env), `7`);
});

Deno.test(`Differing output, but make sure no fatal error`, () => {
  const env = makeEnvChain();
  const t = String.raw`(read-string ";; comment")`;
  const s = String.raw`nil`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`eval: (eval (read-string "(+ 2 3)"))`, () => {
  const env = makeEnvChain();
  const t = String.raw`(eval (read-string "(+ 2 3)"))`;
  const s = String.raw`5`;
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`Load the same file twice.`, { permissions: { read: true } }, () => {
  const env = makeEnvChain();
  const t = String.raw`(slurp "./tests/mal/test.txt")`; // 相対パスは、denoコマンドを実行したパス基準。
  const s = String.raw`"A line of text\n"`;
  assertEquals(evalHelper(t, env), s);
  assertEquals(evalHelper(t, env), s);
});

Deno.test(`load-file`, { permissions: { read: true } }, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(load-file "./tests/mal/inc.mal")`, env), "nil");
  assertEquals(evalHelper(`(inc1 7)`, env), "8");
  assertEquals(evalHelper(`(inc2 7)`, env), "9");
  assertEquals(evalHelper(`(inc3 9)`, env), "12");
});

Deno.test(`atoms`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! inc3 (fn* (a) (+ 3 a)))`, env);
  assertEquals(evalHelper(`(def! a (atom 2))`, env), "(atom 2)");
  assertEquals(evalHelper(`(atom? a)`, env), "true");
  assertEquals(evalHelper(`(atom? 1)`, env), "false");
  assertEquals(evalHelper(`(deref a)`, env), "2");
  assertEquals(evalHelper(`(reset! a 3)`, env), "3");
  assertEquals(evalHelper(`(deref a)`, env), "3");

  assertEquals(evalHelper(`(swap! a inc3)`, env), "6");
  assertEquals(evalHelper(`(deref a)`, env), "6");
  assertEquals(evalHelper(`(swap! a (fn* (a) a))`, env), "6");
  assertEquals(evalHelper(`(swap! a (fn* (a) (* 2 a)))`, env), "12");
  assertEquals(evalHelper(`(swap! a (fn* (a b) (* a b)) 10)`, env), "120");
  assertEquals(evalHelper(`(swap! a + 3)`, env), "123");
});

Deno.test(`swap!/closure interaction`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! inc-it (fn* (a) (+ 1 a)))`, env);
  evalHelper(`(def! atm (atom 7))`, env);
  evalHelper(`(def! f (fn* () (swap! atm inc-it)))`, env);
  assertEquals(evalHelper(`(f)`, env), "8");
  assertEquals(evalHelper(`(f)`, env), "9");
  assertEquals(evalHelper(`(f)`, env), "10");
});

Deno.test(`whether closures can retain atoms`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! g (let* (atm (atom 0)) (fn* () (deref atm))))`, env);
  evalHelper(`(def! atm (atom 1))`, env);
  assertEquals(evalHelper(`(g)`, env), "0");
});

Deno.test(`reading of large files`, { permissions: { read: true } }, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(load-file "./tests/mal/computations.mal")`, env),
    "nil",
  );
  assertEquals(evalHelper(`(sumdown 2)`, env), "3");
  assertEquals(evalHelper(`(fib 2)`, env), "1");
});

Deno.test(`'@' reader macro (short for 'deref')`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! atm (atom 9))`, env);
  assertEquals(evalHelper(`@atm`, env), "9");
});

Deno.test(`vector params not broken by TCO`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! g (fn* [] 78))`, env);
  assertEquals(evalHelper(`(g)`, env), "78");
  evalHelper(`(def! g (fn* [a] (+ a 78)))`, env);
  assertEquals(evalHelper(`(g 3)`, env), "81");
});

Deno.test(`*ARGV* exists and is an empty list`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(list? *ARGV*)`, env), "true");
  assertEquals(evalHelper(`*ARGV*`, env), "()");
});

Deno.test(`eval sets aa in root scope, and that it is found in nested scope`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(
      `(let* (b 12) (do (eval (read-string "(def! aa 7)")) aa ))`,
      env,
    ),
    "7",
  );
});

Deno.test(`comments in a file`, { permissions: { read: true } }, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(load-file "./tests/mal/incB.mal")`, env), "nil");
  assertEquals(evalHelper(`(inc4 7)`, env), "11");
  assertEquals(evalHelper(`(inc5 7)`, env), "12");
});

Deno.test(`map literal across multiple lines in a file`, {
  permissions: { read: true },
}, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(load-file "./tests/mal/incC.mal")`, env), "nil");
  assertEquals(evalHelper(`mymap`, env), `{"a" 1}`);
});

Deno.test(`Checking that eval does not use local environments.`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! a 1)`, env), "1");
  assertEquals(evalHelper(`(let* (a 2) (eval (read-string "a")))`, env), "1");
});

Deno.test(`Non alphanumeric characters in comments in read-string`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(read-string "1;!")`, env), "1");
  assertEquals(evalHelper(String.raw`(read-string "1;\"")`, env), "1");
  assertEquals(evalHelper(`(read-string "1;#")`, env), "1");
  assertEquals(evalHelper(`(read-string "1;$")`, env), "1");
  assertEquals(evalHelper(`(read-string "1;%")`, env), "1");
  assertEquals(evalHelper(`(read-string "1;'")`, env), "1");
  assertEquals(evalHelper(String.raw`(read-string "1;\\")`, env), "1");
  assertEquals(evalHelper(String.raw`(read-string "1;\\\\")`, env), "1");
  assertEquals(evalHelper(String.raw`(read-string "1;\\\\\\")`, env), "1");
  assertEquals(evalHelper('(read-string "1;`")', env), "1");
  assertEquals(evalHelper(`(read-string "1;!")`, env), "1");
});

Deno.test(`Hopefully less problematic characters can be checked together`, () => {
  const env = makeEnvChain();
  const t = String.raw`(read-string "1; &()*+,-./:;<=>?@[]^_{|}~")`;
  assertEquals(evalHelper(t, env), "1");
});
