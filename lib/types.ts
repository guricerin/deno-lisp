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

export interface TyKeyword {
  kind: Kind.Keyword;
  name: string;
}

export interface TyVector {
  kind: Kind.Vector;
  list: Ty[];
}

export type TyKey = TyString | TyKeyword;

export interface TyHashMap {
  kind: Kind.HashMap;
  map: Map<TyKey, Ty>;
}

export type Env = Map<string, Ty>;

/**
 * 先頭ほどinner env.
 * 環境を参照する時は、先頭から見ていく。
 */
export type EnvChain = Env[];

// https://typescriptbook.jp/reference/functions/rest-parameters
export type Fn = (...args: Ty[]) => Ty;

export interface TyBuiltinFn {
  kind: Kind.BuiltinFn;
  fn: Fn;
}

export interface TyFunc {
  kind: Kind.Func;
  /**
   * 仮引数: inner envで実引数の値にbindされる。
   */
  params: TySymbol[];
  body: Ty;
  closure: EnvChain;
}
