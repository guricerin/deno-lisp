import {
  Env,
  makeBuiltinFunc,
  makeEnv,
  makeNumber,
  Ty,
  TyNumber,
} from "./types.ts";

export function makeBuiltinEnv(): Env {
  const env = makeEnv();

  const arith = (op: (x: number, y: number) => number) => {
    const res = (...args: Ty[]): Ty => {
      const x = args[0] as TyNumber;
      const y = args[1] as TyNumber;
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
