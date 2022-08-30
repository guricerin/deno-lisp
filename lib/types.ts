export type Ty =
  | TyList
  | TyNumber
  | TyString
  | TyNil
  | TyBool
  | TySymbol
  | TyKeyword
  | TyVector
  | TyHashMap;

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
  Function = "function",
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

export function makeSymbol(name: string): Ty {
  switch (name) {
    case "nil": {
      return { kind: Kind.Nil };
    }
    case "true": {
      return {
        kind: Kind.Bool,
        val: true,
      };
    }
    case "false": {
      return {
        kind: Kind.Bool,
        val: false,
      };
    }
    default: {
      return {
        kind: Kind.Symbol,
        name: name,
      };
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
    default: {
      const _exhaustiveCheck: never = ty;
      throw new Error(`unexthaustive! : ${_exhaustiveCheck}`);
    }
  }
}
