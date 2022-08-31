import { stdio } from "./deps.ts";
import { EnvChain, Ty, tyToString } from "./lib/types.ts";
import { makeBuiltinEnv } from "./lib/env.ts";
import { parse } from "./lib/reader.ts";
import { evalAst } from "./lib/eval.ts";

function read(s: string): Ty | undefined {
  return parse(s);
}

function evalLisp(ast: Ty | undefined, envChain: EnvChain): Ty | undefined {
  if (ast) {
    return evalAst(ast, envChain);
  } else {
    return ast;
  }
}

function print(ast: Ty | undefined) {
  if (!ast) {
    console.log("");
  } else {
    console.log(tyToString(ast, true));
  }
}

function rep(s: string, envChain: EnvChain) {
  print(evalLisp(read(s), envChain));
}

(async () => {
  const envChain: EnvChain = [makeBuiltinEnv()];
  for await (const line of stdio.readLines(Deno.stdin)) {
    try {
      rep(line, envChain);
    } catch (e) {
      const err = e as Error;
      console.error(err.message);
    }
  }
})();
