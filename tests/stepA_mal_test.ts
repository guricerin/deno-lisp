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

Deno.test(`try*/catch*`, () => {
  const env = makeEnvChain();
  assertEquals(evalHelper(``, env), ``);
});
