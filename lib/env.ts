import {
  Env,
  Kind,
  makeBuiltinFunc,
  makeEnv,
  makeNumber,
  Ty,
} from "./types.ts";

export function makeBuiltinEnv(): Env {
  const env = makeEnv();

  const arith = (op: (x: number, y: number) => number) => {
    const res = (...args: Ty[]): Ty => {
      const x = args[0];
      const y = args[1];
      if (x.kind !== Kind.Number || y.kind !== Kind.Number) {
        throw new Error(
          `unexpected token type: lhs ${x.kind}, rhs ${y.kind}, arith op expected both numbers.`,
        );
      }
      return makeNumber(op(x.val, y.val));
    };
    return res;
  };
  env.set("+", makeBuiltinFunc(arith((x, y) => x + y)));
  env.set("-", makeBuiltinFunc(arith((x, y) => x - y)));
  env.set("*", makeBuiltinFunc(arith((x, y) => x * y)));
  env.set("/", makeBuiltinFunc(arith((x, y) => x / y)));
  return env;
}
