import { stdio } from "./deps.ts";
import { Ty, tyToString } from "./lib/types.ts";
import { parse } from "./lib/reader.ts";

function read(s: string): Ty | undefined {
  return parse(s);
}

function evalExpr(ast: Ty | undefined): Ty | undefined {
  return ast;
}

function print(ast: Ty | undefined) {
  if (!ast) {
    console.log("");
  }
  console.log(tyToString(ast!));
}

function rep(s: string) {
  print(evalExpr(read(s)));
}

(async () => {
  for await (const line of stdio.readLines(Deno.stdin)) {
    try {
      rep(line);
    } catch (e) {
      const err = e as Error;
      console.error(err.message);
    }
  }
})();
