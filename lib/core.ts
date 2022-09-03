import {
  Env,
  equal,
  Kind,
  kNil,
  makeBool,
  makeBuiltinFunc,
  makeEnv,
  makeList,
  makeNumber,
  Ty,
} from "./types.ts";

export function makeBuiltinEnv(): Env {
  const env = makeEnv();

  env.set("+", makeBuiltinFunc(arith((x, y) => x + y)));
  env.set("-", makeBuiltinFunc(arith((x, y) => x - y)));
  env.set("*", makeBuiltinFunc(arith((x, y) => x * y)));
  env.set("/", makeBuiltinFunc(arith((x, y) => x / y)));

  env.set(">", makeBuiltinFunc(comparison((x, y) => x > y)));
  env.set(">=", makeBuiltinFunc(comparison((x, y) => x >= y)));
  env.set("<", makeBuiltinFunc(comparison((x, y) => x < y)));
  env.set("<=", makeBuiltinFunc(comparison((x, y) => x <= y)));

  builtin("=", env, (...args: Ty[]): Ty => {
    const x = args[0];
    const y = args[1];
    return makeBool(equal(x, y));
  });
  builtin("list", env, (...args: Ty[]): Ty => {
    return makeList(args);
  });
  builtin("list?", env, (...args: Ty[]): Ty => {
    const x = args[0];
    return makeBool(x.kind === Kind.List);
  });
  builtin("empty?", env, (...args: Ty[]): Ty => {
    const x = args[0];
    if (equal(x, kNil)) {
      return makeBool(true);
    } else if (x.kind !== Kind.List && x.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${x.kind}, 'empty?' expected list or vector.`,
      );
    } else return makeBool(x.list.length === 0);
  });
  builtin("count", env, (...args: Ty[]): Ty => {
    const x = args[0];
    if (equal(x, kNil)) {
      return makeNumber(0);
    }
    if (x.kind !== Kind.List && x.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${x.kind}, 'count?' expected list or vector.`,
      );
    }
    return makeNumber(x.list.length);
  });
  return env;
}

const builtin = (symbol: string, env: Env, fn: (...args: Ty[]) => Ty) => {
  env.set(symbol, makeBuiltinFunc(fn));
};

const arith = (op: (x: number, y: number) => number) => {
  const res = (...args: Ty[]): Ty => {
    const x = args[0];
    const y = args[1];
    if (x.kind !== Kind.Number || y.kind !== Kind.Number) {
      throw new Error(
        `unexpected expr type: lhs ${x.kind}, rhs ${y.kind}, arith op expected both numbers.`,
      );
    }
    return makeNumber(op(x.val, y.val));
  };
  return res;
};

const comparison = (op: (x: number, y: number) => boolean) => {
  const res = (...args: Ty[]): Ty => {
    const x = args[0];
    const y = args[1];
    if (x.kind !== Kind.Number || y.kind !== Kind.Number) {
      throw new Error(
        `unexpected expr type: lhs ${x.kind}, rhs ${y.kind}, comparison op expected both numbers.`,
      );
    }
    return makeBool(op(x.val, y.val));
  };
  return res;
};
