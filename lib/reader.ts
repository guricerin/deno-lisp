import { Kind, Ty, TyList, TyNumber, TyString, TySymbol } from "./types.ts";
import {
  makeHashMap,
  makeKeyword,
  makeList,
  makeNumber,
  makeString,
  makeSymbol,
  makeVector,
} from "./types_utils.ts";

export class Reader {
  private pos: number = 0;
  private tokens: string[] = [];

  constructor(tokens: string[]) {
    this.tokens = tokens;
  }

  next(): string | null {
    const res = this.peek();
    if (res) {
      this.pos += 1;
    }
    return res;
  }

  peek(): string | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }
}

export function parse(code: string): Ty | undefined {
  const tokens = tokenize(code);
  const reader = new Reader(tokens);
  if (!reader.peek()) {
    return undefined;
  }
  const ast = parseForm(reader);
  return ast;
}

/**
 * [\s,]* : Matches any number of whitespaces or commas. This is not captured so it will be ignored and not tokenized.
 * ~@ : Captures the special two-characters ~@ (tokenized).
 * [\[\]{}()'`~^@] : Captures any special single character, one of []{}()'`~^@ (tokenized).
 * "(?:\\.|[^\\"])*"? : Starts capturing at a double-quote and stops at the next double-quote unless it was preceded by a backslash in which case it includes it until the next double-quote (tokenized). It will also match unbalanced strings (no ending double-quote) which should be reported as an error.
 * ;.* : Captures any sequence of characters starting with ; (tokenized).
 * [^\s\[\]{}('"`,;)]* : Captures a sequence of zero or more non special characters (e.g. symbols, numbers, "true", "false", and "nil") and is sort of the inverse of the one above that captures special characters (tokenized).
 */
function tokenize(code: string): string[] {
  const regexp =
    /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  const res: string[] = [];
  while (true) {
    const matches = regexp.exec(code);
    if (!matches) {
      break;
    }
    const match = matches[1];
    if (match === "") {
      break;
    }
    if (match[0] === ";") { // ignore comment to the end of the line.
      continue;
    }
    res.push(match);
  }
  return res;
}

function parseForm(reader: Reader): Ty {
  const token = reader.peek();
  switch (token) {
    case "(": {
      return parseCollection(reader, makeList, "(", ")");
    }
    case "[": {
      return parseCollection(reader, makeVector, "[", "]");
    }
    case "{": {
      return parseCollection(reader, makeHashMap, "{", "}");
    }
    case "'": {
      return parseQuotes(reader, "quote");
    }
    case "`": {
      return parseQuotes(reader, "quasiquote");
    }
    case "~": {
      return parseQuotes(reader, "unquote");
    }
    case "~@": {
      return parseQuotes(reader, "splice-unquote");
    }
    case "@": {
      return parseQuotes(reader, "deref");
    }
    case "^": {
      return parseMeta(reader);
    }
    default: {
      return parseAtom(reader);
    }
  }
}

function parseMeta(reader: Reader): Ty {
  reader.next(); // drop '^'
  const metaDate = parseForm(reader);
  const fn = parseForm(reader);
  return makeList([makeSymbol("with-meta"), fn, metaDate]);
}

function parseCollection(
  reader: Reader,
  makeCollection: (list: Ty[]) => Ty,
  open: string,
  close: string,
): Ty {
  const start = reader.next(); // drop open paren
  eofCheck(start, `unexpected token: ${start}, expected: ${open}`);

  const list: Ty[] = [];
  while (true) {
    const cur = reader.peek();
    eofCheck(cur, `unexpected EOF, expected: ${close}`);
    if (cur === close) {
      break;
    }
    list.push(parseForm(reader));
  }
  reader.next(); // drop close paren

  return makeCollection(list);
}

function parseQuotes(reader: Reader, name: string): TyList {
  reader.next();
  const sym = makeSymbol(name);
  const target = parseForm(reader);
  return makeList([sym, target]);
}

function parseAtom(reader: Reader): Ty {
  const token = reader.next();
  eofCheck(token, "unexpected eof, expected atom.");

  if (token.match(/^-?[0-9]+$/)) {
    const v = parseInt(token, 10);
    return makeNumber(v);
  } else if (token.match(/^-?[0-9]\.[0-9]+$/)) {
    const v = parseFloat(token);
    return makeNumber(v);
  } else if (token.match(/^"(?:\\.|[^\\"])*"$/)) {
    const v = token
      .slice(1, token.length - 1) // ""の中を取り出す。
      .replace(/\\(.)/g, (_, c: string) => c == "n" ? "\n" : c);
    return makeString(v);
  } else if (token[0] === '"') { // unbalanced double quotes
    throw new Error("unexpected EOF, expected '\"'");
  } else if (token[0] === ":") {
    return makeKeyword(token.substring(1));
  }

  return makeSymbol(token);
}

function eofCheck(token: string | null, msg: string): asserts token {
  if (!token) {
    throw new Error(msg);
  }
}
