export type Ty =
  | TyList
  | TyNumber
  | TyString
  | TyNil
  | TyBool
  | TySymbol
  | TyKeyword
  | TyVector
  | TyHashMap
  | TyBuiltinFn
  | TyFunc;

export const enum Kind {
  List = "list",
  Number = "number",
  String = "string",
  Bool = "bool",
  Nil = "nil",
  Symbol = "symbol",
  Keyword = "keyword",
  Vector = "vector",
  HashMap = "hashmap",
  BuiltinFn = "builtin-fn",
  Func = "function",
  Atom = "atom",
}

export interface TyList {
  kind: Kind.List;
  list: Ty[];
}

export function makeList(list: Ty[]): TyList {
  return {
    kind: Kind.List,
    list: list,
  };
}

export interface TyNumber {
  kind: Kind.Number;
  val: number;
}

export function makeNumber(v: number): TyNumber {
  return {
    kind: Kind.Number,
    val: v,
  };
}

export interface TyString {
  kind: Kind.String;
  val: string;
}

export interface TyNil {
  kind: Kind.Nil;
}

export interface TyBool {
  kind: Kind.Bool;
  val: boolean;
}

export interface TySymbol {
  kind: Kind.Symbol;
  name: string;
}

export const kNil: TyNil = {
  kind: Kind.Nil,
};

export const kTrue: TyBool = {
  kind: Kind.Bool,
  val: true,
};

export const kFalse: TyBool = {
  kind: Kind.Bool,
  val: false,
};

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

export function tyToBool(ty: Ty): boolean {
  switch (ty.kind) {
    case Kind.Bool: {
      return ty.val;
    }
    case Kind.Nil: {
      return false;
    }
    default: {
      throw new Error(
        `unexpected token type: ${ty.kind}, 'cond' expected bool or nil.`,
      );
    }
  }
}

export interface TyKeyword {
  kind: Kind.Keyword;
  name: string;
}

export interface TyVector {
  kind: Kind.Vector;
  list: Ty[];
}

export function makeVector(list: Ty[]): TyVector {
  return {
    kind: Kind.Vector,
    list: list,
  };
}

export type TyKey = TyString | TyKeyword;

export interface TyHashMap {
  kind: Kind.HashMap;
  map: Map<TyKey, Ty>;
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

export type Env = Map<string, Ty>;

export function makeEnv(): Env {
  return new Map<string, Ty>();
}

/**
 * 先頭ほどinner env.
 * 環境を参照する時は、先頭から見ていく。
 */
export type EnvChain = Env[];

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

// https://typescriptbook.jp/reference/functions/rest-parameters
type Fn = (...args: Ty[]) => Ty;

export interface TyBuiltinFn {
  kind: Kind.BuiltinFn;
  fn: Fn;
}

export function makeBuiltinFunc(fn: Fn): TyBuiltinFn {
  return {
    kind: Kind.BuiltinFn,
    fn: fn,
  };
}

export interface TyFunc {
  kind: Kind.Func;
  /**
   * 仮引数: inner envで実引数の値にbindされる。
   */
  params: TySymbol[];
  body: Ty;
  envChain: EnvChain;
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
    envChain: envChain,
  };
}

export function bindArgs(fn: TyFunc, args: Ty[]) {
  if (fn.params.length !== args.length) {
    throw new Error(
      `function params length (${fn.params.length}) is not equal args length (${args.length}).`,
    );
  }
  const innerEnv = makeEnv();
  for (let i = 0; i < args.length; i++) {
    console.log(
      `${i} param: ${fn.params[i].name}, arg: ${JSON.stringify(args[i])}`,
    );
    innerEnv.set(fn.params[i].name, args[i]);
  }
  fn.envChain = [innerEnv, ...fn.envChain];
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
