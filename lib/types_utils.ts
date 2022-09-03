import {
  Env,
  EnvChain,
  Fn,
  kFalse,
  Kind,
  kNil,
  kTrue,
  Ty,
  TyBool,
  TyBuiltinFn,
  TyFunc,
  TyHashMap,
  TyList,
  TyNumber,
  TySymbol,
  TyVector,
} from "./types.ts";

export function makeList(list: Ty[]): TyList {
  return {
    kind: Kind.List,
    list: list,
  };
}

export function makeNumber(v: number): TyNumber {
  return {
    kind: Kind.Number,
    val: v,
  };
}

export function makeSymbol(name: string): Ty {
  switch (name) {
    case "nil": {
      return kNil;
    }
    case "true": {
      return kTrue;
    }
    case "false": {
      return kFalse;
    }
    default: {
      return {
        kind: Kind.Symbol,
        name: name,
      };
    }
  }
}

export function makeBool(b: boolean): TyBool {
  if (b) {
    return kTrue;
  } else {
    return kFalse;
  }
}

export function tyToBool(ty: Ty): boolean {
  switch (ty.kind) {
    case Kind.Bool: {
      return ty.val;
    }
    case Kind.Nil: {
      return false;
    }
    default: {
      return true;
    }
  }
}

export function makeVector(list: Ty[]): TyVector {
  return {
    kind: Kind.Vector,
    list: list,
  };
}

export function makeHashMap(list: Ty[]): TyHashMap {
  const res: TyHashMap = {
    kind: Kind.HashMap,
    map: new Map(),
  };

  while (list.length > 0) {
    const key = list.shift()!;
    const val = list.shift();
    if (!val) {
      throw new Error("unexpected hashmap length.");
    }
    switch (key.kind) {
      case Kind.String: {
        res.map.set(key, val);
        break;
      }
      case Kind.Keyword: {
        res.map.set(key, val);
        break;
      }
      default: {
        throw new Error(
          `unexpected key type: ${key.kind}, expected string or keyword.`,
        );
      }
    }
  }

  return res;
}

export function makeEnv(): Env {
  return new Map<string, Ty>();
}

export function resolveSymbol(
  sym: TySymbol,
  envChain: EnvChain,
): Ty | undefined {
  for (let i = 0; i < envChain.length; i++) {
    const v = envChain[i].get(sym.name);
    if (v) {
      return v;
    }
  }
  return;
}

export function storeKeyVal(sym: TySymbol, val: Ty, envChain: EnvChain): Ty {
  envChain[0].set(sym.name, val);
  return val;
}

export function makeBuiltinFunc(fn: Fn): TyBuiltinFn {
  return {
    kind: Kind.BuiltinFn,
    fn: fn,
  };
}

export function makeFunc(
  params: TySymbol[],
  body: Ty,
  envChain: EnvChain,
): TyFunc {
  return {
    kind: Kind.Func,
    params: params,
    body: body,
    closure: envChain,
  };
}

export function bindArgs(fn: TyFunc, args: Ty[]) {
  const innerEnv = makeEnv();
  for (let i = 0; i < fn.params.length; i++) {
    // 可変長引数
    // ex. (fn* (& more) (count more))
    if (fn.params[i].name === "&") {
      if (fn.params.length <= i + 1) {
        throw new Error(`& (variable length arguments) need to take 1 param.`);
      }
      innerEnv.set(fn.params[i + 1].name, makeList(args.slice(i)));
      break;
    }

    if (args.length <= i) {
      throw new Error(
        `function params length (${fn.params.length}) is not equal args length (${args.length}).`,
      );
    }
    innerEnv.set(fn.params[i].name, args[i]);
  }
  fn.closure = [innerEnv, ...fn.closure];
}

export function equal(x: Ty, y: Ty): boolean {
  if (x.kind === Kind.Nil && y.kind === Kind.Nil) {
    return true;
  } else if (x.kind === Kind.Number && y.kind === Kind.Number) {
    return x.val === y.val;
  } else if (x.kind === Kind.String && y.kind === Kind.String) {
    return x.val === y.val;
  } else if (x.kind === Kind.Symbol && y.kind === Kind.Symbol) {
    return x.name === y.name;
  } else if (x.kind === Kind.Bool && y.kind === Kind.Bool) {
    return x.val === y.val;
  } else if (x.kind === Kind.Keyword && y.kind === Kind.Keyword) {
    return x.name === y.name;
  } else if (x.kind === Kind.List && y.kind === Kind.List) {
    return equalSeq(x, y);
  } else if (x.kind === Kind.Vector && y.kind === Kind.Vector) {
    return equalSeq(x, y);
  }

  return false;
}

function equalSeq(x: TyList | TyVector, y: TyList | TyVector): boolean {
  if (x.kind !== y.kind) {
    return false;
  } else if (x.list.length !== y.list.length) {
    return false;
  } else if (x.list.length === 0 && y.list.length === 0) {
    return true;
  }

  return x.list.map((_, i) => {
    return equal(x.list[i], y.list[i]);
  }).reduce((acc, b) => {
    return acc && b;
  });
}

/**
 * @param ty
 * @param readably : When it is true, doublequotes, newlines, and backslashes are translated into their printed representations (the reverse of the reader).
 * @returns
 */
export function tyToString(ty: Ty, readably: boolean): string {
  switch (ty.kind) {
    case Kind.List: {
      const list = ty.list.map((x) => tyToString(x, readably));
      return `(${list.join(" ")})`;
    }
    case Kind.Number: {
      return `${ty.val}`;
    }
    case Kind.String: {
      if (readably) {
        const s = ty.val
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n");
        return `"${s}"`;
      } else {
        return `"${ty.val}"`;
      }
    }
    case Kind.Nil: {
      return `${ty.kind}`;
    }
    case Kind.Bool: {
      return `${ty.val}`;
    }
    case Kind.Symbol: {
      return `${ty.name}`;
    }
    case Kind.Keyword: {
      return `:${ty.name}`;
    }
    case Kind.Vector: {
      const vec = ty.list.map((x) => tyToString(x, readably));
      return `[${vec.join(" ")}]`;
    }
    case Kind.HashMap: {
      const mp: Ty[] = [];
      ty.map.forEach((v, k) => {
        mp.push(k);
        mp.push(v);
      });
      const content = mp.map((x) => tyToString(x, readably));
      return `{${content.join(" ")}}`;
    }
    case Kind.BuiltinFn: {
      return "#<built-in-function>";
    }
    case Kind.Func: {
      return "#<function>";
    }
    default: {
      const _exhaustiveCheck: never = ty;
      throw new Error(`unexthaustive! : ${_exhaustiveCheck}`);
    }
  }
}
