import { Env, EnvChain, Kind, kNil, Ty } from "./types.ts";
import {
  equal,
  makeBool,
  makeBuiltinFunc,
  makeEnv,
  makeList,
  makeNumber,
  makeString,
  tyToString,
} from "./types_utils.ts";
import { parse } from "./reader.ts";
import { evalAst } from "./eval.ts";

export function initEnvChain(): EnvChain {
  const res = [makeBuiltinEnv()];
  const helper = ((code: string) => {
    evalAst(parse(code), res);
  });
  helper("(def! not (fn* (a) (if a false true)))");
  return res;
}

function makeBuiltinEnv(): Env {
  const env = makeEnv();

  env.set("+", makeBuiltinFunc(arith((x, y) => x + y)));
  env.set("-", makeBuiltinFunc(arith((x, y) => x - y)));
  env.set("*", makeBuiltinFunc(arith((x, y) => x * y)));
  env.set("/", makeBuiltinFunc(arith((x, y) => x / y)));

  env.set(">", makeBuiltinFunc(comparison((x, y) => x > y)));
  env.set(">=", makeBuiltinFunc(comparison((x, y) => x >= y)));
  env.set("<", makeBuiltinFunc(comparison((x, y) => x < y)));
  env.set("<=", makeBuiltinFunc(comparison((x, y) => x <= y)));

  const builtin = (symbol: string, fn: (...args: Ty[]) => Ty) => {
    env.set(symbol, makeBuiltinFunc(fn));
  };

  builtin("=", (...args: Ty[]): Ty => {
    const x = args[0];
    const y = args[1];
    return makeBool(equal(x, y));
  });
  builtin("prn", (...args: Ty[]): Ty => {
    const x = args[0];
    console.log(tyToString(x, true));
    return kNil;
  });
  builtin("pr-str", (...args: Ty[]): Ty => {
    const s = args.map((x) => {
      return tyToString(x, true);
    }).join(" ");
    return makeString(s);
  });
  builtin("str", (...args: Ty[]): Ty => {
    const s = args.map((x) => {
      return tyToString(x, false);
    }).join("");
    return makeString(s);
  });
  builtin("list", (...args: Ty[]): Ty => {
    return makeList(args);
  });
  builtin("list?", (...args: Ty[]): Ty => {
    const x = args[0];
    return makeBool(x.kind === Kind.List);
  });
  builtin("empty?", (...args: Ty[]): Ty => {
    const x = args[0];
    if (equal(x, kNil)) {
      return makeBool(true);
    } else if (x.kind !== Kind.List && x.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${x.kind}, 'empty?' expected list or vector.`,
      );
    } else return makeBool(x.list.length === 0);
  });
  builtin("count", (...args: Ty[]): Ty => {
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
