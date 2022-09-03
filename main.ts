import { stdio } from "./deps.ts";
import { EnvChain, Ty } from "./lib/types.ts";
import { tyToString } from "./lib/types_utils.ts";
import { initEnvChain } from "./lib/core.ts";
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
  const envChain: EnvChain = initEnvChain();
  for await (const line of stdio.readLines(Deno.stdin)) {
    try {
      rep(line, envChain);
    } catch (e) {
      const err = e as Error;
      console.error(err.message);
    }
  }
})();
