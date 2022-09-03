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

// 末尾再帰最適化がなされていない場合、これらのテストケースはtypescriptのほうでコールスタックが尽きる。

Deno.test(`recursive tail-call function`, () => {
  const env = makeEnvChain();
  evalHelper(
    "(def! sum2 (fn* (n acc) (if (= n 0) acc (sum2 (- n 1) (+ n acc)))))",
    env,
  );
  assertEquals(evalHelper("(sum2 10 0)", env), "55");
  assertEquals(evalHelper("(def! res2 nil)", env), "nil");
  evalHelper(
    "(def! res2 (sum2 10000 0))",
    env,
  );
  assertEquals(evalHelper("res2", env), "50005000");
});

Deno.test(`mutually recursive tail-call functions`, () => {
  const env = makeEnvChain();
  evalHelper(
    "(def! foo (fn* (n) (if (= n 0) 0 (bar (- n 1)))))",
    env,
  );
  evalHelper(
    "(def! bar (fn* (n) (if (= n 0) 0 (foo (- n 1)))))",
    env,
  );
  assertEquals(evalHelper("(foo 10000)", env), "0");
});
