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
