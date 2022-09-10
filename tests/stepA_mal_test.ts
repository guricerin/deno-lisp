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

Deno.test(`*host-language*`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(= "something bogus" *host-language*)`, env),
    `false`,
  );
});

Deno.test(`hash-map evaluation and atoms (i.e. an env)`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! e (atom {"+" +}))`, env);
  evalHelper(`(swap! e assoc "-" -)`, env);
  assertEquals(evalHelper(`( (get @e "+") 7 8)`, env), `15`);
  assertEquals(evalHelper(`( (get @e "-") 11 8)`, env), `3`);
  evalHelper(`(swap! e assoc "foo" (list))`, env);
  assertEquals(evalHelper(`(get @e "foo")`, env), `()`);
  evalHelper(`(swap! e assoc "bar" '(1 2 3))`, env);
  assertEquals(evalHelper(`(get @e "bar")`, env), `(1 2 3)`);
});

Deno.test(`presence of optional functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`metadata on mal functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(meta (fn* (a) a))`, env), `nil`);
  assertEquals(
    evalHelper(`(meta (with-meta (fn* (a) a) {"b" 1}))`, env),
    `{"b" 1}`,
  );
  assertEquals(
    evalHelper(`(meta (with-meta (fn* (a) a) "abc"))`, env),
    `"abc"`,
  );
  evalHelper(`(def! l-wm (with-meta (fn* (a) a) {"b" 2}))`, env);
  assertEquals(evalHelper(`(meta l-wm)`, env), `{"b" 2}`);
  assertEquals(
    evalHelper(`(meta (with-meta l-wm {"new_meta" 123}))`, env),
    `{"new_meta" 123}`,
  );
  assertEquals(evalHelper(`(meta l-wm)`, env), `{"b" 2}`);
  evalHelper(`(def! f-wm (with-meta (fn* [a] (+ 1 a)) {"abc" 1}))`, env);
  assertEquals(evalHelper(`(meta f-wm)`, env), `{"abc" 1}`);
  assertEquals(
    evalHelper(`(meta (with-meta f-wm {"new_meta" 123}))`, env),
    `{"new_meta" 123}`,
  );
  assertEquals(evalHelper(`(meta f-wm)`, env), `{"abc" 1}`);
  evalHelper(`(def! f-wm2 ^{"abc" 1} (fn* [a] (+ 1 a)))`, env);
  assertEquals(evalHelper(`(meta f-wm2)`, env), `{"abc" 1}`);
});

Deno.test(`Meta of native functions should return nil (not fail)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(meta +)`, env), `nil`);
  evalHelper(
    `(def! gen-plusX (fn* (x) (with-meta (fn* (b) (+ x b)) {"meta" 1})))`,
    env,
  );
  evalHelper(`(def! plus7 (gen-plusX 7))`, env);
  evalHelper(`(def! plus8 (gen-plusX 8))`, env);
  assertEquals(evalHelper(`(plus7 8)`, env), `15`);
  assertEquals(evalHelper(`(meta plus7)`, env), `{"meta" 1}`);
  assertEquals(evalHelper(`(meta plus8)`, env), `{"meta" 1}`);
  assertEquals(
    evalHelper(`(meta (with-meta plus7 {"meta" 2}))`, env),
    `{"meta" 2}`,
  );
  assertEquals(evalHelper(`(meta plus8)`, env), `{"meta" 1}`);
});

Deno.test(`Make sure closures and metadata co-exist`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`string? function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(string? "")`, env), `true`);
  assertEquals(evalHelper(`(string? 'abc)`, env), `false`);
  assertEquals(evalHelper(`(string? "abc")`, env), `true`);
  assertEquals(evalHelper(`(string? :abc)`, env), `false`);
  assertEquals(evalHelper(`(string? (keyword "abc"))`, env), `false`);
  assertEquals(evalHelper(`(string? 234)`, env), `false`);
  assertEquals(evalHelper(`(string? nil)`, env), `false`);
});

Deno.test(`number? function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(number? 123)`, env), `true`);
  assertEquals(evalHelper(`(number? -1)`, env), `true`);
  assertEquals(evalHelper(`(number? nil)`, env), `false`);
  assertEquals(evalHelper(`(number? false)`, env), `false`);
  assertEquals(evalHelper(`(number? "123")`, env), `false`);
});

Deno.test(`fn? function`, () => {
  const env = makeEnvChain();
  evalHelper(
    `(def! add1 (fn* (x) (+ x 1)))`,
    env,
  );
  assertEquals(evalHelper(`(fn? +)`, env), `true`);
  assertEquals(evalHelper(`(fn? add1)`, env), `true`);
  assertEquals(evalHelper(`(fn? cond)`, env), `false`);
  assertEquals(evalHelper(`(fn? "+")`, env), `false`);
  assertEquals(evalHelper(`(fn? :+)`, env), `false`);
  assertEquals(evalHelper(`(fn? ^{"ismacro" true} (fn* () 0))`, env), `true`);
});

Deno.test(`macro? function`, () => {
  const env = makeEnvChain();
  evalHelper(
    `(def! add1 (fn* (x) (+ x 1)))`,
    env,
  );
  assertEquals(evalHelper(`(macro? cond)`, env), `true`);
  assertEquals(evalHelper(`(macro? +)`, env), `false`);
  assertEquals(evalHelper(`(macro? add1)`, env), `false`);
  assertEquals(evalHelper(`(macro? "+")`, env), `false`);
  assertEquals(evalHelper(`(macro? :+)`, env), `false`);
  assertEquals(evalHelper(`(macro? {})`, env), `false`);
});

Deno.test(`conj function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(conj (list) 1)`, env), `(1)`);
  assertEquals(evalHelper(`(conj (list 1) 2)`, env), `(2 1)`);
  assertEquals(evalHelper(`(conj (list 2 3) 4)`, env), `(4 2 3)`);
  assertEquals(evalHelper(`(conj (list 2 3) 4 5 6)`, env), `(6 5 4 2 3)`);
  assertEquals(evalHelper(`(conj (list 1) (list 2 3))`, env), `((2 3) 1)`);

  assertEquals(evalHelper(`(conj [] 1)`, env), `[1]`);
  assertEquals(evalHelper(`(conj [1] 2)`, env), `[1 2]`);
  assertEquals(evalHelper(`(conj [2 3] 4)`, env), `[2 3 4]`);
  assertEquals(evalHelper(`(conj [2 3] 4 5 6)`, env), `[2 3 4 5 6]`);
  assertEquals(evalHelper(`(conj [1] [2 3])`, env), `[1 [2 3]]`);
});

Deno.test(`seq function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(seq "abc")`, env), `("a" "b" "c")`);
  assertEquals(
    evalHelper(`(apply str (seq "this is a test"))`, env),
    `"this is a test"`,
  );
  assertEquals(evalHelper(`(seq '(2 3 4))`, env), `(2 3 4)`);
  assertEquals(evalHelper(`(seq [2 3 4])`, env), `(2 3 4)`);
  assertEquals(evalHelper(`(seq "")`, env), `nil`);
  assertEquals(evalHelper(`(seq '())`, env), `nil`);
  assertEquals(evalHelper(`(seq [])`, env), `nil`);
  assertEquals(evalHelper(`(seq nil)`, env), `nil`);
});

Deno.test(`metadata on collections`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(meta [1 2 3])`, env), `nil`);
  assertEquals(evalHelper(`(with-meta [1 2 3] {"a" 1})`, env), `[1 2 3]`);
  assertEquals(
    evalHelper(`(meta (with-meta [1 2 3] {"a" 1}))`, env),
    `{"a" 1}`,
  );
  assertEquals(
    evalHelper(`(vector? (with-meta [1 2 3] {"a" 1}))`, env),
    `true`,
  );
  assertEquals(evalHelper(`(meta (with-meta [1 2 3] "abc"))`, env), `"abc"`);
  assertEquals(evalHelper(`(with-meta [] "abc")`, env), `[]`);
  assertEquals(
    evalHelper(`(meta (with-meta (list 1 2 3) {"a" 1}))`, env),
    `{"a" 1}`,
  );
  assertEquals(
    evalHelper(`(list? (with-meta (list 1 2 3) {"a" 1}))`, env),
    `true`,
  );
  assertEquals(evalHelper(`(with-meta (list) {"a" 1})`, env), `()`);
  assertEquals(evalHelper(`(empty? (with-meta (list) {"a" 1}))`, env), `true`);
  assertEquals(
    evalHelper(`(meta (with-meta {"abc" 123} {"a" 1}))`, env),
    `{"a" 1}`,
  );
  assertEquals(
    evalHelper(`(map? (with-meta {"abc" 123} {"a" 1}))`, env),
    `true`,
  );
  assertEquals(evalHelper(`(with-meta {} {"a" 1})`, env), `{}`);
  assertEquals(
    evalHelper(`(def! l-wm (with-meta [4 5 6] {"b" 2}))`, env),
    `[4 5 6]`,
  );
  assertEquals(evalHelper(`(meta l-wm)`, env), `{"b" 2}`);
  assertEquals(
    evalHelper(`(meta (with-meta l-wm {"new_meta" 123}))`, env),
    `{"new_meta" 123}`,
  );
  assertEquals(evalHelper(`(meta l-wm)`, env), `{"b" 2}`);
});

Deno.test(`metadata on builtin functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(meta +)`, env), `nil`);
  evalHelper(`(def! f-wm3 ^{"def" 2} +)`, env);
  assertEquals(evalHelper(`(meta f-wm3)`, env), `{"def" 2}`);
  assertEquals(evalHelper(`(meta +)`, env), `nil`);
});

Deno.test(`time-ms function`, () => {
  const env = makeEnvChain();
  // Loading sumdown from computations.mal
  assertEquals(evalHelper(``, env), ``);
});
