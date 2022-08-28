import { stdio } from "./deps.ts";

function read(s: string): string {
  return s;
}

function evalExpr(s: string): string {
  return s;
}

function print(s: string): string {
  console.log(s);
  return s;
}

function rep(s: string): string {
  return print(evalExpr(read(s)));
}

(async () => {
  for await (const line of stdio.readLines(Deno.stdin)) {
    rep(line);
  }
})();
