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

Deno.test(`try*/catch*`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(try* 123 (catch* e 456))`, env), `123`);
  assertEquals(
    evalHelper(`(try* abc (catch* exc (prn "exc is:" exc)))`, env),
    `nil`,
  );
  assertEquals(
    evalHelper(`(try* (abc 1 2) (catch* exc (prn "exc is:" exc)))`, env),
    `nil`,
  );
});

Deno.test(`Make sure error from core can be caught`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(try* (nth () 1) (catch* exc (prn "exc is:" exc)))`, env),
    `nil`,
  );
  assertEquals(
    evalHelper(
      `(try* (throw "my exception") (catch* exc (do (prn "exc:" exc) 7)))`,
      env,
    ),
    `7`,
  );
});

Deno.test(`exception handlers get restored correctly`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(
      `(try* (do (try* "t1" (catch* e "c1")) (throw "e1")) (catch* e "c2"))`,
      env,
    ),
    `"c2"`,
  );
  assertEquals(
    evalHelper(
      `(try* (try* (throw "e1") (catch* e (throw "e2"))) (catch* e "c2"))`,
      env,
    ),
    `"c2"`,
  );
});

Deno.test(`throw is a function`, () => {
  const env = makeEnvChain();
  assertEquals(
    evalHelper(`(try* (map throw (list "my err")) (catch* exc exc))`, env),
    `"my err"`,
  );
});

Deno.test(`builtin functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(symbol? 'abc)`, env), `true`);
  assertEquals(evalHelper(`(symbol? "abc")`, env), `false`);
  assertEquals(evalHelper(`(nil? nil)`, env), `true`);
  assertEquals(evalHelper(`(nil? true)`, env), `false`);
  assertEquals(evalHelper(`(true? true)`, env), `true`);
  assertEquals(evalHelper(`(true? false)`, env), `false`);
  assertEquals(evalHelper(`(true? true?)`, env), `false`);
  assertEquals(evalHelper(`(false? false)`, env), `true`);
  assertEquals(evalHelper(`(false? true)`, env), `false`);
});

Deno.test(`apply function with core functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`apply function with user functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`map function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`symbol and keyword functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(symbol? :abc)`, env), `false`);
  assertEquals(evalHelper(`(symbol? 'abc)`, env), `true`);
  assertEquals(evalHelper(`(symbol? "abc")`, env), `false`);
  assertEquals(evalHelper(`(symbol? (symbol "abc"))`, env), `true`);
  assertEquals(evalHelper(`(keyword? :abc)`, env), `true`);
  assertEquals(evalHelper(`(keyword? 'abc)`, env), `false`);
  assertEquals(evalHelper(`(keyword? "abc")`, env), `false`);
  assertEquals(evalHelper(`(keyword? "")`, env), `false`);
  assertEquals(evalHelper(`(keyword? (keyword "abc"))`, env), `true`);
  assertEquals(evalHelper(`(symbol "abc")`, env), `abc`);
  assertEquals(evalHelper(`(keyword "abc")`, env), `:abc`);
});

Deno.test(`sequential? function`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(sequential? (list 1 2 3))`, env), `true`);
  assertEquals(evalHelper(`(sequential? [15])`, env), `true`);
  assertEquals(evalHelper(`(sequential? sequential?)`, env), `false`);
  assertEquals(evalHelper(`(sequential? nil)`, env), `false`);
  assertEquals(evalHelper(`(sequential? "abc")`, env), `false`);
});

Deno.test(`apply function with core functions and arguments in vector`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`apply function with user functions and arguments in vector`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`map function with vectors`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`vector functions`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(vector? [10 11])`, env), `true`);
  assertEquals(evalHelper(`(vector? '(12 13))`, env), `false`);
  assertEquals(evalHelper(`(vector 3 4 5)`, env), `[3 4 5]`);
  assertEquals(evalHelper(`(= [] (vector))`, env), `true`);
  assertEquals(evalHelper(`(map? {})`, env), `true`);
  assertEquals(evalHelper(`(map? '())`, env), `false`);
  assertEquals(evalHelper(`(map? [])`, env), `false`);
  assertEquals(evalHelper(`(map? 'abc)`, env), `false`);
  assertEquals(evalHelper(`(map? :abc)`, env), `false`);
});

Deno.test(`hash-maps`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(hash-map "a" 1)`, env), `{"a" 1}`);
  assertEquals(evalHelper(`{"a" 1}`, env), `{"a" 1}`);
  assertEquals(evalHelper(`(assoc {} "a" 1)`, env), `{"a" 1}`);
  assertEquals(
    evalHelper(`(get (assoc (assoc {"a" 1 } "b" 2) "c" 3) "a")`, env),
    `1`,
  );
  assertEquals(evalHelper(`(def! hm1 (hash-map))`, env), `{}`);
  assertEquals(evalHelper(`(map? hm1)`, env), `true`);
  assertEquals(evalHelper(`(map? 1)`, env), `false`);
  assertEquals(evalHelper(`(map? "abc")`, env), `false`);
  assertEquals(evalHelper(`(get nil "a")`, env), `nil`);
  assertEquals(evalHelper(`(get hm1 "a")`, env), `nil`);
  assertEquals(evalHelper(`(contains? hm1 "a")`, env), `false`);
  assertEquals(evalHelper(`(def! hm2 (assoc hm1 "a" 1))`, env), `{"a" 1}`);
  assertEquals(evalHelper(`(get hm1 "a")`, env), `nil`);
  assertEquals(evalHelper(`(contains? hm1 "a")`, env), `false`);
  assertEquals(evalHelper(`(get hm2 "a")`, env), `1`);
  assertEquals(evalHelper(`(contains? hm2 "a")`, env), `true`);

  // Clojure returns nil but this breaks mal impl
  assertEquals(evalHelper(`(keys hm1)`, env), `()`);
  assertEquals(evalHelper(`(= () (keys hm1))`, env), `true`);
  assertEquals(evalHelper(`(keys hm2)`, env), `("a")`);
  assertEquals(evalHelper(`(keys {"1" 1})`, env), `("1")`);

  // Clojure returns nil but this breaks mal impl
  assertEquals(evalHelper(`(vals hm1)`, env), `()`);
  assertEquals(evalHelper(`(= () (vals hm1))`, env), `true`);
  assertEquals(evalHelper(`(vals hm2)`, env), `(1)`);
  assertEquals(evalHelper(`(count (keys (assoc hm2 "b" 2 "c" 3)))`, env), `3`);
});

Deno.test(`keywords as hash-map keys`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(get {:abc 123} :abc)`, env), `123`);
  assertEquals(evalHelper(`(contains? {:abc 123} :abc)`, env), `true`);
  assertEquals(evalHelper(`(contains? {:abcd 123} :abc)`, env), `false`);
  assertEquals(evalHelper(`(assoc {} :bcd 234)`, env), `{:bcd 234}`);
  assertEquals(
    evalHelper(`(keyword? (nth (keys {:abc 123 :def 456}) 0))`, env),
    `true`,
  );
  assertEquals(
    evalHelper(`(keyword? (nth (vals {"a" :abc "b" :def}) 0))`, env),
    `true`,
  );
});

Deno.test(`whether assoc updates properly`, () => {
  const env = makeEnvChain();
  evalHelper(`(def! hm4 (assoc {:a 1 :b 2} :a 3 :c 1))`, env);
  assertEquals(evalHelper(`(get hm4 :a)`, env), `3`);
  assertEquals(evalHelper(`(get hm4 :b)`, env), `2`);
  assertEquals(evalHelper(`(get hm4 :c)`, env), `1`);
});

Deno.test(`nil as hash-map values`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(contains? {:abc nil} :abc)`, env), `true`);
  assertEquals(evalHelper(`(assoc {} :bcd nil)`, env), `{:bcd nil}`);
});

Deno.test(`Additional str and pr-str tests`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(str "A" {:abc "val"} "Z")`, env), `"A{:abc val}Z"`);
  assertEquals(
    evalHelper(`(str true "." false "." nil "." :keyw "." 'symb)`, env),
    `"true.false.nil.:keyw.symb"`,
  );
  assertEquals(
    evalHelper(`(pr-str "A" {:abc "val"} "Z")`, env),
    String.raw`"\"A\" {:abc \"val\"} \"Z\""`,
  );
  assertEquals(
    evalHelper(`(pr-str true "." false "." nil "." :keyw "." 'symb)`, env),
    String.raw`"true \".\" false \".\" nil \".\" :keyw \".\" symb"`,
  );
  evalHelper(`(def! s (str {:abc "val1" :def "val2"}))`, env);
  assertEquals(
    evalHelper(
      String
        .raw`(cond (= s "{:abc val1 :def val2}") true (= s "{:def val2 :abc val1}") true)`,
      env,
    ),
    `true`,
  );
  evalHelper(`(def! p (pr-str {:abc "val1" :def "val2"}))`, env);
  assertEquals(
    evalHelper(
      String
        .raw`(cond (= p "{:abc \"val1\" :def \"val2\"}") true (= p "{:def \"val2\" :abc \"val1\"}") true)`,
      env,
    ),
    `true`,
  );
});

Deno.test(`extra function arguments as Mal List (bypassing TCO with apply)`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`throwing a hash-map`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`try* without catch*`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`throwing non-strings`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`dissoc`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(`(def! hm1 (hash-map))`, env), `{}`);
  assertEquals(evalHelper(`(def! hm2 (assoc hm1 "a" 1))`, env), `{"a" 1}`);
  evalHelper(`(def! hm3 (assoc hm2 "b" 2))`, env);
  assertEquals(evalHelper(`(count (keys hm3))`, env), `2`);
  assertEquals(evalHelper(`(count (vals hm3))`, env), `2`);
  assertEquals(evalHelper(`(dissoc hm3 "a")`, env), `{"b" 2}`);
  assertEquals(evalHelper(`(dissoc hm3 "a" "b")`, env), `{}`);
  assertEquals(evalHelper(`(dissoc hm3 "a" "b" "c")`, env), `{}`);
  assertEquals(evalHelper(`(count (keys hm3))`, env), `2`);
  assertEquals(
    evalHelper(`(dissoc {:cde 345 :fgh 456} :cde)`, env),
    `{:fgh 456}`,
  );
  assertEquals(
    evalHelper(`(dissoc {:cde nil :fgh 456} :cde)`, env),
    `{:fgh 456}`,
  );
});

Deno.test(`equality of hash-maps`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`hashmaps don't alter function ast`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
