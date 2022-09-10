import { EnvChain, Kind, kNil, Ty, TyList, TyVector } from "./types.ts";
import {
  bindArgs,
  makeEnv,
  makeFunc,
  makeHashMap,
  makeKeyword,
  makeList,
  makeString,
  makeSymbol,
  makeVector,
  resolveSymbol,
  storeKeyVal,
  toMacro,
  tyToBool,
} from "./types_utils.ts";

export function evalAst(ast: Ty | undefined, envChain: EnvChain): Ty {
  // tail call optimization
  tco:
  while (true) {
    if (!ast) {
      return kNil;
    }
    if (ast.kind !== Kind.List) {
      return evalExpr(ast, envChain);
    }
    if (ast.list.length === 0) {
      return ast;
    }

    ast = macroExpand(ast, envChain);
    if (ast.kind !== Kind.List) {
      return evalExpr(ast, envChain);
    }
    if (ast.list.length === 0) {
      return ast;
    }

    const first = ast.list[0];
    switch (first.kind) {
      case Kind.Symbol: { // special forms
        switch (first.name) {
          case "def!": { // (def! x y)
            const [, sym, val] = ast.list;
            if (sym.kind !== Kind.Symbol) {
              throw new Error(
                `unexpected expr type: ${sym.kind}, 'def!' expected symbol.`,
              );
            }
            return storeKeyVal(sym, evalAst(val, envChain), envChain);
          }
          case "let*": { // (let* (key val ...) ret)
            const letEnvChain = [makeEnv(), ...envChain];
            const pairs = ast.list[1];
            switch (pairs.kind) {
              case Kind.List:
              case Kind.Vector: {
                const list = pairs.list;
                for (let i = 0; i < list.length; i += 2) {
                  const key = list[i];
                  const val = list[i + 1];
                  if (key.kind !== Kind.Symbol) {
                    throw new Error(
                      `unexpected expr type: ${key.kind}, expected symbol.`,
                    );
                  }
                  storeKeyVal(key, evalAst(val, letEnvChain), letEnvChain);
                }
                ast = ast.list[2];
                envChain = letEnvChain;
                continue tco;
              }
              default: {
                throw new Error(
                  `unexpected expr type: ${pairs.kind}, 'let*' expected list or vector.`,
                );
              }
            }
            break;
          }
          case "if": {
            const [, cond, conseq, alt] = ast.list;
            const res = evalAst(cond, envChain);
            if (tyToBool(res)) {
              ast = conseq;
              continue tco;
            } else {
              ast = alt;
              continue tco;
            }
          }
          case "fn*": {
            const [, args, body] = ast.list;
            if (args.kind !== Kind.List && args.kind !== Kind.Vector) {
              throw new Error(
                `unexpected expr type ${args.kind}, 'fn*' args expected list or vector.`,
              );
            }
            const symbols = args.list.map((param) => {
              if (param.kind !== Kind.Symbol) {
                throw new Error(
                  `unexpected expr type: ${param.kind}, 'fn*' expected symbol.`,
                );
              }
              return param;
            });
            return makeFunc(symbols, body, envChain);
          }
          case "do": {
            const [, ...body] = ast.list;
            ast = body.map((x) => {
              return evalAst(x, envChain);
            }).slice(-1)[0]; // 最後の式を返り値とする。
            continue tco;
          }
          case "quote": {
            const [, q] = ast.list;
            return q; // 評価はせずそのまま返す。
          }
          case "quasiquote": {
            const [, q] = ast.list;
            ast = quasiquote(q);
            continue tco;
          }
          case "quasiquoteexpand": { // デバッグ用。実用では使わない。
            const [, q] = ast.list;
            return quasiquote(q);
          }
          case "defmacro!": {
            const [, sym, fnStar] = ast.list;
            if (sym.kind !== Kind.Symbol) {
              throw new Error(
                `unexpected expr type: ${sym.kind}, 'defmacro!' expected symbol as 1st arg.`,
              );
            }
            const fn = evalAst(fnStar, envChain);
            if (fn.kind !== Kind.Func) {
              throw new Error(
                `unexpected expr type: ${fn.kind}, 'defmacro!' expected function as 2nd arg.`,
              );
            }
            return storeKeyVal(
              sym,
              toMacro(fn),
              envChain,
            );
          }
          case "macroexpand": { // デバッグ用。実用では使わない。
            const [, q] = ast.list;
            return macroExpand(q, envChain);
          }
          case "try*": {
            const tryAst = ast.list[1];
            try {
              return evalAst(tryAst, envChain);
            } catch (e) {
              if (ast.list.length < 3) {
                throw e;
              }
              const catchAst = ast.list[2];
              if (
                catchAst.kind !== Kind.List && catchAst.kind !== Kind.Vector
              ) {
                throw new Error(
                  `unexpected expr type: ${catchAst.kind}, 'try*' expected list or vector as 2nd arg.`,
                );
              }
              const catchSym = catchAst.list[0];
              if (catchSym.kind === Kind.Symbol && catchSym.name === "catch*") {
                const errSym = catchAst.list[1];
                if (errSym.kind !== Kind.Symbol) {
                  throw new Error(
                    `unexpected expr type: ${errSym.kind}, expected symbol.`,
                  );
                }
                const err = (() => {
                  if (e instanceof Error) {
                    return makeString((e as Error).message);
                  } else {
                    return e as Ty;
                  }
                })();
                const nextAst = catchAst.list[2];
                storeKeyVal(errSym, err, envChain);
                return evalAst(nextAst, envChain);
              } else {
                throw e;
              } // if (catchSym.kind === Kind.Symbol && catchSym.name === "catch*")
            } // catch
          }
          default: {
            break;
          }
        } // switch (first.name)
      }
    } // switch (first.kind)

    // apply
    const result = evalExpr(ast, envChain);
    switch (result.kind) {
      case Kind.List:
      case Kind.Vector: {
        const [f, ...args] = result.list;
        switch (f.kind) {
          case Kind.BuiltinFn: {
            return f.fn(...args);
          }
          case Kind.Func: {
            bindArgs(f, args);
            ast = f.body;
            envChain = f.closure;
            continue tco;
          }
          default: {
            throw new Error(
              `unexpected expr type: ${f.kind}, expected: builtin-fn or function`,
            );
          }
        }
        break;
      }
      default: {
        throw new Error(
          `unexpected expr type: ${result.kind}, apply expected: list or vector.`,
        );
      }
    } // switch (result.kind)
  } // while (true)
}

function evalExpr(expr: Ty, envChain: EnvChain): Ty {
  switch (expr.kind) {
    case Kind.Symbol: {
      const res = resolveSymbol(expr, envChain);
      if (!res) {
        throw new Error(`undefined symbol: ${expr.name}`);
      } else {
        return res;
      }
    }
    case Kind.List: {
      const ls = expr.list.map((ty) => evalAst(ty, envChain));
      return makeList(ls);
    }
    case Kind.Vector: {
      const ls = expr.list.map((ty) => evalAst(ty, envChain));
      return makeVector(ls);
    }
    case Kind.HashMap: {
      const ls: Ty[] = [];
      for (const [k, v] of expr.strMap.entries()) {
        ls.push(makeString(k));
        ls.push(evalAst(v, envChain));
      }
      for (const [k, v] of expr.keywordMap.entries()) {
        ls.push(makeKeyword(k));
        ls.push(evalAst(v, envChain));
      }
      return makeHashMap(ls);
    }
    default: {
      return expr;
    }
  }
}

function macroExpand(ast: Ty, envChain: EnvChain): Ty {
  while (true) {
    if (ast.kind !== Kind.List) {
      break;
    }
    const [sym, ...args] = ast.list;
    if (sym.kind !== Kind.Symbol) {
      break;
    }
    const macro = resolveSymbol(sym, envChain);
    if (!macro || macro.kind !== Kind.Macro) {
      break;
    }

    bindArgs(macro, args);
    ast = evalAst(macro.body, macro.closure);
  }

  return ast;
}

/**
 * quasiquote内でのみ意味をもつ特殊形式
 * - unquote
 * - splice-unquote
 * - ref: http://www.nct9.ne.jp/m_hiroi/func/abcscm31.html
 */
function quasiquote(elt: Ty): Ty {
  switch (elt.kind) {
    case Kind.Symbol:
    case Kind.HashMap: {
      return makeList([makeSymbol("quote"), elt]);
    }
    case Kind.List: {
      if (startsWith(elt.list, "unquote")) {
        const [, q] = elt.list;
        return q;
      } else {
        return qqFoldBack(elt);
      }
    }
    case Kind.Vector: {
      return makeList([makeSymbol("vec"), qqFoldBack(elt)]);
    }
    default: {
      return elt;
    }
  }
}

function qqFoldBack(elt: TyList | TyVector): TyList {
  let acc = makeList([]);
  for (let i = elt.list.length - 1; i >= 0; i--) {
    acc = qqLoop(elt.list[i], acc);
  }
  return acc;
}

function qqLoop(elt: Ty, acc: TyList): TyList {
  if (elt.kind === Kind.List && startsWith(elt.list, "splice-unquote")) {
    const [, cdr] = elt.list;
    const ls = [makeSymbol("concat"), cdr, acc];
    return makeList(ls);
  } else {
    const ls = [makeSymbol("cons"), quasiquote(elt), acc];
    return makeList(ls);
  }
}

function startsWith(ls: Ty[], sym: string): boolean {
  if (ls.length !== 2) {
    return false;
  }

  const [first, ..._rem] = ls;
  switch (first.kind) {
    case Kind.Symbol: {
      return first.name === sym;
    }
  }
  return false;
}
