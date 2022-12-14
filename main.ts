import { EnvChain, Ty, TySymbol } from "./lib/types.ts";
import {
  makeList,
  makeString,
  makeSymbol,
  storeKeyVal,
  tyToString,
} from "./lib/types_utils.ts";
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

(() => {
  const envChain: EnvChain = initEnvChain();
  const [filePath, ...args] = Deno.args;

  if (filePath) {
    try {
      const code = `(load-file "${filePath}")`;
      storeKeyVal(
        makeSymbol("*ARGV*") as TySymbol,
        makeList(args.map((x) => makeString(x))),
        envChain,
      );
      evalLisp(read(code), envChain);
    } catch (e) {
      const err = e as Error;
      console.error(`Error: ${err.message}`);
    }
  } else {
    evalLisp(read(`(println (str "Mal [" *host-language* "]"))`), envChain);
    while (true) {
      const line = prompt("user>");
      if (!line) {
        continue;
      }
      try {
        rep(line, envChain);
      } catch (e) {
        const err = e as Error;
        console.error(`Error: ${err.message}`);
      }
    }
  }
})();
