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
  assertEquals(evalHelper(``, env), ``);
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
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
  assertEquals(evalHelper(``, env), ``);
});

Deno.test(`hash-maps`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
