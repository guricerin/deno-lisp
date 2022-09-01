import {
  EnvChain,
  Kind,
  makeEnv,
  makeHashMap,
  makeList,
  makeVector,
  resolveSymbol,
  storeKeyVal,
  Ty,
  TyList,
} from "./types.ts";

export function evalAst(ast: Ty, envChain: EnvChain): Ty {
  switch (ast.kind) {
    case Kind.List: {
      if (ast.list.length === 0) {
        return ast;
      } else {
        const sp = specialForm(ast, envChain);
        return sp ?? apply(ast, envChain);
      }
    }
    default: {
      return evalExpr(ast, envChain);
    }
  }
}

function specialForm(ast: TyList, envChain: EnvChain): Ty | undefined {
  const first = ast.list[0];
  if (first.kind !== Kind.Symbol) {
    return;
  }

  switch (first.name) {
    case "def!": { // (def! x y)
      const [, key, val] = ast.list;
      if (key.kind !== Kind.Symbol) {
        throw new Error(
          `unexpected token type: ${key.kind}, 'def!' expected symbol.`,
        );
      }
      return storeKeyVal(key, evalAst(val, envChain), envChain);
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
                `unexpected token type: ${key.kind}, expected symbol.`,
              );
            }
            storeKeyVal(key, evalAst(val, letEnvChain), letEnvChain);
          }
          return evalAst(ast.list[2], letEnvChain);
        }
        default: {
          throw new Error(
            `unexpected token type: ${pairs.kind}, 'let*' expected list or vector.`,
          );
        }
      }
    }
  }
}

function apply(ls: TyList, envChain: EnvChain): Ty {
  const result = evalExpr(ls, envChain);
  switch (result.kind) {
    case Kind.List:
    case Kind.Vector: {
      const [f, ...args] = result.list;
      switch (f.kind) {
        case Kind.BuiltinFn: {
          return f.fn(...args);
        }
        case Kind.Func: {
          // TODO
          return f;
        }
        default: {
          throw new Error(
            `unexpected token type: ${f.kind}, expected: builtin-fn or function`,
          );
        }
      }
    }
    default: {
      throw new Error(
        `unexpected token type: ${result.kind}, expected: list or vector.`,
      );
    }
  }
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
