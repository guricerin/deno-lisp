import { Env, EnvChain, Kind, kNil, Ty } from "./types.ts";
import {
  bindArgs,
  equal,
  makeAtom,
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
  const defInMal = ((code: string) => {
    evalAst(parse(code), res);
  });
  defInMal("(def! not (fn* (a) (if a false true)))");
  defInMal(
    '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))',
  );
  defInMal("(def! *ARGV* (list))");
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
    const [x, y] = args;
    return makeBool(equal(x, y));
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
  builtin("prn", (...args: Ty[]): Ty => {
    const s = args.map((x) => {
      return tyToString(x, true);
    }).join(" ");
    console.log(s);
    return kNil;
  });
  builtin("println", (...args: Ty[]): Ty => {
    const s = args.map((x) => {
      return tyToString(x, false);
    }).join(" ");
    console.log(s);
    return kNil;
  });
  builtin("list", (...args: Ty[]): Ty => {
    return makeList(args);
  });
  builtin("list?", (...args: Ty[]): Ty => {
    const [x] = args;
    return makeBool(x.kind === Kind.List);
  });
  builtin("cons", (...args: Ty[]): Ty => {
    const [x, y] = args;
    if (y.kind !== Kind.List && y.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${y.kind}, 'cons' expected list or vector as 2nd arg.`,
      );
    }
    return makeList([x].concat(y.list));
  });
  // builtin("concat", (...args: Ty[]): Ty => {
  //   args.reduce((acc, a) => {

  //   })
  // });
  builtin("empty?", (...args: Ty[]): Ty => {
    const [x] = args;
    if (equal(x, kNil)) {
      return makeBool(true);
    } else if (x.kind !== Kind.List && x.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${x.kind}, 'empty?' expected list or vector.`,
      );
    } else return makeBool(x.list.length === 0);
  });
  builtin("count", (...args: Ty[]): Ty => {
    const [x] = args;
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
  builtin("read-string", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.String: {
        return parse(x.val) ?? kNil;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${x.kind}, 'read-string' expected string.`,
        );
      }
    }
  });
  builtin("eval", (...args: Ty[]): Ty => {
    const [x] = args;
    return evalAst(x, [env]);
  });
  builtin("slurp", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.String: {
        const text = Deno.readTextFileSync(x.val);
        return makeString(text);
      }
      default: {
        throw new Error(
          `unexpected expr type: ${x.kind}, 'slurp' expected string.`,
        );
      }
    }
  });
  builtin("atom", (...args: Ty[]): Ty => {
    const [a] = args;
    return makeAtom(a);
  });
  builtin("atom?", (...args: Ty[]): Ty => {
    const [a] = args;
    return makeBool(a.kind === Kind.Atom);
  });
  builtin("deref", (...args: Ty[]): Ty => {
    const [a] = args;
    switch (a.kind) {
      case Kind.Atom: {
        return a.ref;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${a.kind}, 'deref' expected atom.`,
        );
      }
    }
  });
  builtin("reset!", (...args: Ty[]): Ty => {
    const [a, ref] = args;
    switch (a.kind) {
      case Kind.Atom: {
        a.ref = ref;
        return ref;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${a.kind}, 'reset!' expected atom.`,
        );
      }
    }
  });
  builtin("swap!", (...args: Ty[]): Ty => {
    const [a, f, ...vars] = args;
    if (a.kind !== Kind.Atom) {
      throw new Error(
        `unexpected expr type: ${a.kind}, 'swap!' expected atom as 1st arg.`,
      );
    }

    switch (f.kind) {
      case Kind.Func: {
        // apply
        bindArgs(f, [a.ref, ...vars]);
        a.ref = evalAst(f.body, f.closure);
        return a.ref;
      }
      case Kind.BuiltinFn: {
        // apply
        a.ref = f.fn(...[a.ref, ...vars]);
        return a.ref;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${f.kind}, 'swap!' expected atom as 2nd arg.`,
        );
      }
    }
  });

  return env;
}

const arith = (op: (x: number, y: number) => number) => {
  const res = (...args: Ty[]): Ty => {
    const [x, y] = args;
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
    const [x, y] = args;
    if (x.kind !== Kind.Number || y.kind !== Kind.Number) {
      throw new Error(
        `unexpected expr type: lhs ${x.kind}, rhs ${y.kind}, comparison op expected both numbers.`,
      );
    }
    return makeBool(op(x.val, y.val));
  };
  return res;
};
