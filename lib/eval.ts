import {
  EnvChain,
  Kind,
  makeHashMap,
  makeList,
  makeVector,
  resolveSymbol,
  Ty,
  TyList,
} from "./types.ts";

export function evalExpr(ast: Ty, envChain: EnvChain): Ty {
  switch (ast.kind) {
    case Kind.List: {
      if (ast.list.length === 0) {
        return ast;
      } else {
        return apply(ast, envChain);
      }
    }
    default: {
      return evalAst(ast, envChain);
    }
  }
}

function apply(ls: TyList, envChain: EnvChain): Ty {
  const result = evalAst(ls, envChain);
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

function evalAst(ast: Ty, envChain: EnvChain): Ty {
  switch (ast.kind) {
    case Kind.Symbol: {
      const res = resolveSymbol(ast, envChain);
      if (!res) {
        throw new Error(`undefined symbol: ${ast.name}`);
      } else {
        return res;
      }
    }
    case Kind.List: {
      const ls = ast.list.map((ty) => evalExpr(ty, envChain));
      return makeList(ls);
    }
    case Kind.Vector: {
      const ls = ast.list.map((ty) => evalExpr(ty, envChain));
      return makeVector(ls);
    }
    case Kind.HashMap: {
      // TODO
      const ls: Ty[] = [];
      return makeHashMap(ls);
    }
    default: {
      return ast;
    }
  }
}
