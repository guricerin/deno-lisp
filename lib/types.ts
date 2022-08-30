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

export interface TyHashMap {
  kind: Kind.HashMap;
  stringMap: Map<string, Ty>;
  keywordMap: Map<Ty, Ty>;
}

export function makeHashMap(list: Ty[]): TyHashMap {
  return {
    kind: Kind.HashMap,
    stringMap: new Map(),
    keywordMap: new Map(),
  };
}

export function tyToString(ty: Ty): string {
  switch (ty.kind) {
    case Kind.List: {
      const list = ty.list.map((x) => tyToString(x));
      return `(${list.join(" ")})`;
    }
    case Kind.Number: {
      return `${ty.val}`;
    }
    case Kind.String: {
      return `"${ty.val}"`;
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
      const vec = ty.list.map((x) => tyToString(x));
      return `[${vec.join(" ")}]`;
    }
    case Kind.HashMap: {
      const todo = "TODO";
      return `{${todo}}`;
    }
    default: {
      const _exhaustiveCheck: never = ty;
      throw new Error(`unexthaustive! : ${_exhaustiveCheck}`);
    }
  }
}
