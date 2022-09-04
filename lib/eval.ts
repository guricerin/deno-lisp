import { EnvChain, Kind, kNil, Ty } from "./types.ts";
import {
  bindArgs,
  makeEnv,
  makeFunc,
  makeHashMap,
  makeList,
  makeVector,
  resolveSymbol,
  storeKeyVal,
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
            const letEnvChain = [makeEnv(), ...envChain]; // 既存の（外側の）環境は破壊的変更をしないようにする。
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
      for (const [k, v] of expr.map.entries()) {
        ls.push(k);
        ls.push(evalAst(v, envChain));
      }
      return makeHashMap(ls);
    }
    default: {
      return expr;
    }
  }
}
