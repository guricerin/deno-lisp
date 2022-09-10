import { Env, EnvChain, kFalse, Kind, kNil, kTrue, Ty } from "./types.ts";
import {
  assignMeta,
  bindArgs,
  deleteKeys,
  equal,
  getKeys,
  getVals,
  getValue,
  makeAtom,
  makeBool,
  makeBuiltinFunc,
  makeEnv,
  makeHashMap,
  makeKeyword,
  makeList,
  makeNumber,
  makeString,
  makeSymbol,
  makeVector,
  mergeHashMap,
  tyToString,
} from "./types_utils.ts";
import { parse } from "./reader.ts";
import { evalAst } from "./eval.ts";

export function initEnvChain(): EnvChain {
  const res = [makeBuiltinEnv()];
  const defInMal = ((code: string) => {
    evalAst(parse(code), res);
  });
  defInMal(`(def! *host-language* "TypeScript")`);
  defInMal("(def! not (fn* (a) (if a false true)))");
  defInMal(
    '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))',
  );
  defInMal("(def! *ARGV* (list))");
  defInMal(
    "(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))",
  );
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
  builtin("throw", (...args: Ty[]): Ty => {
    const [x] = args;
    throw x;
  });
  builtin("nil?", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.Nil:
        return kTrue;
      default:
        return kFalse;
    }
  });
  builtin("true?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Bool && x.val === true;
    return makeBool(res);
  });
  builtin("false?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Bool && x.val === false;
    return makeBool(res);
  });
  builtin("string?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.String;
    return makeBool(res);
  });
  builtin("symbol", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.String: {
        return makeSymbol(x.val);
      }
      default: {
        throw new Error(
          `unexpected expr type: ${x.kind}, 'symbol' expected string.`,
        );
      }
    }
  });
  builtin("symbol?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Symbol;
    return makeBool(res);
  });
  builtin("keyword", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.String: {
        return makeKeyword(x.val);
      }
      case Kind.Keyword: {
        return x;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${x.kind}, 'keyword' expected string.`,
        );
      }
    }
  });
  builtin("keyword?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Keyword;
    return makeBool(res);
  });
  builtin("number?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Number;
    return makeBool(res);
  });
  builtin("fn?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Func || x.kind === Kind.BuiltinFn;
    return makeBool(res);
  });
  builtin("macro?", (...args: Ty[]): Ty => {
    const [x] = args;
    const res = x.kind === Kind.Macro;
    return makeBool(res);
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
  builtin("vector", (...args: Ty[]): Ty => {
    return makeVector(args);
  });
  builtin("vector?", (...args: Ty[]): Ty => {
    const [x] = args;
    return makeBool(x.kind === Kind.Vector);
  });
  builtin("hash-map", (...args: Ty[]): Ty => {
    return makeHashMap(args);
  });
  builtin("map?", (...args: Ty[]): Ty => {
    const [x] = args;
    return makeBool(x.kind === Kind.HashMap);
  });
  builtin("assoc", (...args: Ty[]): Ty => {
    const [map, ...rem] = args;
    if (map.kind !== Kind.HashMap) {
      throw new Error(
        `unexpected expr type: ${map.kind}, 'assoc' expected hashmap as 1st arg.`,
      );
    }
    return mergeHashMap(map, rem);
  });
  builtin("dissoc", (...args: Ty[]): Ty => {
    const [map, ...keys] = args;
    if (map.kind !== Kind.HashMap) {
      throw new Error(
        `unexpected expr type: ${map.kind}, 'dissoc' expected hashmap as 1st arg.`,
      );
    }
    return deleteKeys(map, keys);
  });
  builtin("get", (...args: Ty[]): Ty => {
    const [map, key] = args;
    if (map.kind !== Kind.HashMap) {
      return kNil;
    }
    if (key.kind !== Kind.String && key.kind !== Kind.Keyword) {
      throw new Error(
        `unexpected expr type: ${key.kind}, 'get' expected string or keyword as 2nd arg.`,
      );
    }
    return getValue(map, key);
  });
  builtin("contains?", (...args: Ty[]): Ty => {
    const [map, key] = args;
    if (map.kind !== Kind.HashMap) {
      throw new Error(
        `unexpected expr type: ${key.kind}, 'contains?' expected hashmap as 1st arg.`,
      );
    }
    if (key.kind !== Kind.String && key.kind !== Kind.Keyword) {
      throw new Error(
        `unexpected expr type: ${key.kind}, 'contains?' expected string or keyword as 2nd arg.`,
      );
    }
    const k = getKeys(map).list.find((v) => equal(v, key));
    const res = (() => {
      if (k) {
        return true;
      } else {
        return false;
      }
    })();
    return makeBool(res);
  });
  builtin("keys", (...args: Ty[]): Ty => {
    const [map] = args;
    if (map.kind !== Kind.HashMap) {
      throw new Error(
        `unexpected expr type: ${map.kind}, 'keys' expected hashmap as 1st arg.`,
      );
    }
    return getKeys(map);
  });
  builtin("vals", (...args: Ty[]): Ty => {
    const [map] = args;
    if (map.kind !== Kind.HashMap) {
      throw new Error(
        `unexpected expr type: ${map.kind}, 'keys' expected hashmap as 1st arg.`,
      );
    }
    return getVals(map);
  });
  builtin("sequential?", (...args: Ty[]): Ty => {
    const [x] = args;
    return makeBool(x.kind === Kind.List || x.kind === Kind.Vector);
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
  builtin("concat", (...args: Ty[]): Ty => {
    const ls = args
      .map((l) => {
        if (l.kind !== Kind.List && l.kind !== Kind.Vector) {
          throw new Error(
            `unexpected expr type: ${l.kind}, 'concat' expected list or vector.`,
          );
        }
        return l.list;
      })
      .reduce((acc, l) => acc.concat(l), []);
    return makeList(ls);
  });
  builtin("vec", (...args: Ty[]): Ty => {
    const [ls] = args;
    switch (ls.kind) {
      case Kind.List: {
        return makeVector(ls.list);
      }
      case Kind.Vector: {
        return ls;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${ls.kind}, 'vec' expected list or vector.`,
        );
      }
    }
  });
  builtin("nth", (...args: Ty[]): Ty => {
    const [ls, i] = args;
    if (ls.kind !== Kind.List && ls.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${ls.kind}, 'nth' expected list or vector as 1st arg.`,
      );
    }
    if (i.kind !== Kind.Number) {
      throw new Error(
        `unexpected expr type: ${i.kind}, 'nth' expected number as 2nd arg.`,
      );
    }
    if (ls.list.length <= i.val) {
      return kNil;
    }
    return ls.list[i.val];
  });
  builtin("first", (...args: Ty[]): Ty => {
    const [ls] = args;
    if (ls.kind === Kind.Nil) {
      return kNil;
    }
    if (ls.kind !== Kind.List && ls.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${ls.kind}, 'first' expected list or vector as 1st arg.`,
      );
    }
    if (ls.list.length === 0) {
      return kNil;
    } else {
      return ls.list[0];
    }
  });
  builtin("rest", (...args: Ty[]): Ty => {
    const [ls] = args;
    if (ls.kind === Kind.Nil) {
      return makeList([]);
    }
    if (ls.kind !== Kind.List && ls.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${ls.kind}, 'first' expected list or vector as 1st arg.`,
      );
    }
    if (ls.list.length === 0) {
      return makeList([]);
    } else {
      return makeList(ls.list.slice(1));
    }
  });
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
  builtin("apply", (...args: Ty[]): Ty => { // (apply F A B (C D)) => (F A B C D)
    const [fn, ...vars] = args;
    const ls = vars.slice(-1)[0];
    if (ls.kind !== Kind.List && ls.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${ls.kind}, 'apply' expected list or vector as last arg.`,
      );
    }
    const as = vars.slice(0, -1).concat(ls.list);
    switch (fn.kind) {
      case Kind.BuiltinFn: {
        return fn.fn(...as);
      }
      case Kind.Func: {
        const ast = makeList([fn, ...as]);
        return evalAst(ast, [env]);
      }
      default: {
        throw new Error(
          `unexpected expr type: ${fn.kind}, 'apply' expected function or built-in-fn as 1st arg.`,
        );
      }
    }
  });
  builtin("map", (...args: Ty[]): Ty => {
    const [fn, ls] = args;
    if (ls.kind !== Kind.List && ls.kind !== Kind.Vector) {
      throw new Error(
        `unexpected expr type: ${ls.kind}, 'map' expected list or vector as 2nd arg.`,
      );
    }
    switch (fn.kind) {
      case Kind.Func: {
        const res = ls.list.map((x) => {
          bindArgs(fn, [x]);
          return evalAst(fn.body, fn.closure);
        });
        return makeList(res);
      }
      case Kind.BuiltinFn: {
        const res = ls.list.map((x) => {
          return fn.fn(x);
        });
        return makeList(res);
      }
      default: {
        throw new Error(
          `unexpected expr type: ${fn.kind}, 'map' expected function or built-in-fn as 1st arg.`,
        );
      }
    }
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
  builtin("readline", (...args: Ty[]): Ty => {
    const [x] = args;
    if (x.kind !== Kind.String) {
      throw new Error(
        `unexpected expr type: ${x.kind}, 'readline' expected string.`,
      );
    }
    const line = prompt(x.val);
    if (!line) {
      return kNil;
    } else {
      return makeString(line);
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
  builtin("conj", (...args: Ty[]): Ty => {
    const [ls, ...elms] = args;
    switch (ls.kind) {
      case Kind.List: {
        const rev = [...elms];
        return makeList([...rev.reverse(), ...ls.list]);
      }
      case Kind.Vector: {
        return makeVector([...ls.list, ...elms]);
      }
      default: {
        throw new Error(
          `unexpected expr type: ${ls.kind}, 'conj' expected list or vector as 1st arg.`,
        );
      }
    }
  });
  builtin("seq", (...args: Ty[]): Ty => {
    const [seq] = args;
    switch (seq.kind) {
      case Kind.List: {
        return seq.list.length === 0 ? kNil : seq;
      }
      case Kind.Vector: {
        return seq.list.length === 0 ? kNil : makeList(seq.list);
      }
      case Kind.String: {
        if (seq.val === "") {
          return kNil;
        }
        const s = [...seq.val].map((x) => makeString(x));
        return makeList(s);
      }
      case Kind.Nil: {
        return seq;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${seq.kind}, 'seq' expected list or vector or string or nil.`,
        );
      }
    }
  });
  builtin("meta", (...args: Ty[]): Ty => {
    const [x] = args;
    switch (x.kind) {
      case Kind.List:
      case Kind.Vector:
      case Kind.HashMap:
      case Kind.BuiltinFn:
      case Kind.Func:
      case Kind.Macro: {
        return x.meta;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${x.kind}, 'meta' expected list or vector or hashmap or function or built-in-fn or macro.`,
        );
      }
    }
  });
  builtin("with-meta", (...args: Ty[]): Ty => {
    const [x, meta] = args;
    return assignMeta(x, meta);
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
  builtin("time-ms", (..._args: Ty[]): Ty => {
    const now = Date.now();
    return makeNumber(now);
  });
  builtin("ts-eval", (...args: Ty[]): Ty => {
    const [code] = args;
    if (code.kind !== Kind.String) {
      throw new Error(
        `unexpected expr type: ${code.kind}, 'ts-eval' expected string.`,
      );
    }
    const res = eval(code.val);
    const ty = typeof res;
    switch (ty) {
      case "number": {
        return makeNumber(res);
      }
      case "string": {
        return makeString(res);
      }
      case "boolean": {
        return makeBool(res);
      }
      default: {
        return kNil;
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
