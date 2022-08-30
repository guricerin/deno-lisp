import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { tyToString } from "../lib/types.ts";
import { parse } from "../lib/reader.ts";

function parseHelper(code: string): string {
  return tyToString(parse(code));
}

/**
 * read of numbers
 */
Deno.test("read of numbers: 1", () => {
  const actual = parseHelper("1");
  const expect = "1";
  assertEquals(actual, expect);
});

Deno.test("read of numbers: 7", () => {
  const actual = parseHelper("7");
  const expect = "7";
  assertEquals(actual, expect);
});

Deno.test("read of numbers:   7", () => {
  const actual = parseHelper("  7");
  const expect = "7";
  assertEquals(actual, expect);
});

Deno.test("read of numbers: -123", () => {
  const actual = parseHelper("-123");
  const expect = "-123";
  assertEquals(actual, expect);
});

/**
 * read of symbols
 */
Deno.test("read of symbols: +", () => {
  const actual = parseHelper("+");
  const expect = "+";
  assertEquals(actual, expect);
});

Deno.test("read of symbols: abc", () => {
  const actual = parseHelper("abc");
  const expect = "abc";
  assertEquals(actual, expect);
});

Deno.test("read of symbols:   abc", () => {
  const actual = parseHelper("  abc");
  const expect = "abc";
  assertEquals(actual, expect);
});

Deno.test("read of symbols: abc5", () => {
  const actual = parseHelper("abc5");
  const expect = "abc5";
  assertEquals(actual, expect);
});

Deno.test("read of symbols: abc-def", () => {
  const actual = parseHelper("abc-def");
  const expect = "abc-def";
  assertEquals(actual, expect);
});

/**
 * non-numbers starting with a dash
 */
Deno.test("non-numbers starting with a dash: -", () => {
  const actual = parseHelper("-");
  const expect = "-";
  assertEquals(actual, expect);
});

Deno.test("non-numbers starting with a dash: -abc", () => {
  const actual = parseHelper("-abc");
  const expect = "-abc";
  assertEquals(actual, expect);
});

Deno.test("non-numbers starting with a dash: ->>", () => {
  const actual = parseHelper("->>");
  const expect = "->>";
  assertEquals(actual, expect);
});

/**
 * read of lists
 */
Deno.test("read of lists: (+ 1 2)", () => {
  const actual = parseHelper("(+ 1 2)");
  const expect = "(+ 1 2)";
  assertEquals(actual, expect);
});

Deno.test("read of lists: ()", () => {
  const actual = parseHelper("()");
  const expect = "()";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (  )", () => {
  const actual = parseHelper("(  )");
  const expect = "()";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (nil)", () => {
  const actual = parseHelper("(nil)");
  const expect = "(nil)";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (())", () => {
  const actual = parseHelper("(())");
  const expect = "(())";
  assertEquals(actual, expect);
});

Deno.test("read of lists: ((3 4))", () => {
  const actual = parseHelper("((3 4))");
  const expect = "((3 4))";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (+ 1 (+ 2 3))", () => {
  const actual = parseHelper("(+ 1 (+ 2 3))");
  const expect = "(+ 1 (+ 2 3))";
  assertEquals(actual, expect);
});

Deno.test("read of lists:   ( +   1   (+   2 3   )   )  ", () => {
  const actual = parseHelper("  ( +   1   (+   2 3   )   )  ");
  const expect = "(+ 1 (+ 2 3))";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (* 1 2)", () => {
  const actual = parseHelper("(* 1 2)");
  const expect = "(* 1 2)";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (** 1 2)", () => {
  const actual = parseHelper("(** 1 2)");
  const expect = "(** 1 2)";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (* -3 6)", () => {
  const actual = parseHelper("(* -3 6)");
  const expect = "(* -3 6)";
  assertEquals(actual, expect);
});

Deno.test("read of lists: (()())", () => {
  const actual = parseHelper("(()())");
  const expect = "(() ())";
  assertEquals(actual, expect);
});

Deno.test("commas as whitespace", () => {
  const actual = parseHelper("(1 2, 3,,,,),,");
  const expect = "(1 2 3)";
  assertEquals(actual, expect);
});

Deno.test("read of nil", () => {
  const actual = parseHelper("nil");
  const expect = "nil";
  assertEquals(actual, expect);
});

Deno.test("read of true", () => {
  const actual = parseHelper("true");
  const expect = "true";
  assertEquals(actual, expect);
});

Deno.test("read of false", () => {
  const actual = parseHelper("false");
  const expect = "false";
  assertEquals(actual, expect);
});

Deno.test("read of strings: abc", () => {
  const actual = parseHelper('"abc"');
  const expect = '"abc"';
  assertEquals(actual, expect);
});

Deno.test("read of strings:   abc", () => {
  const actual = parseHelper('   "abc"');
  const expect = '"abc"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "abc (with parens)"', () => {
  const actual = parseHelper('"abc (with parens)"');
  const expect = '"abc (with parens)"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "abc\\"def"', () => {
  const actual = parseHelper('"abc\\"def"');
  const expect = '"abc"def"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ""', () => {
  const actual = parseHelper('""');
  const expect = '""';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "\\"', () => {
  const s = String.raw`"\\"`;
  const actual = parseHelper(s);
  const expect = String.raw`"\"`;
  assertEquals(actual, expect);
});

Deno.test('read of strings: "\\\\\\\\\\\\\\\\\\"', () => {
  const s = String.raw`"\\\\\\\\\\\\\\\\\\"`;
  const actual = parseHelper(s);
  const expect = String.raw`"\\\\\\\\\"`;
  assertEquals(actual, expect);
});

Deno.test('read of strings: "&"', () => {
  const actual = parseHelper('"&"');
  const expect = '"&"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "\'"', () => {
  const actual = parseHelper('"\'"');
  const expect = '"\'"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "("', () => {
  const actual = parseHelper('"("');
  const expect = '"("';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ")"', () => {
  const actual = parseHelper('")"');
  const expect = '")"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "*"', () => {
  const actual = parseHelper('"*"');
  const expect = '"*"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ","', () => {
  const actual = parseHelper('","');
  const expect = '","';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "-"', () => {
  const actual = parseHelper('"-"');
  const expect = '"-"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "/"', () => {
  const actual = parseHelper('"/"');
  const expect = '"/"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ":"', () => {
  const actual = parseHelper('":"');
  const expect = '":"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ";"', () => {
  const actual = parseHelper('";"');
  const expect = '";"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "<"', () => {
  const actual = parseHelper('"<"');
  const expect = '"<"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "="', () => {
  const actual = parseHelper('"="');
  const expect = '"="';
  assertEquals(actual, expect);
});

Deno.test('read of strings: ">"', () => {
  const actual = parseHelper('">"');
  const expect = '">"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "?"', () => {
  const actual = parseHelper('"?"');
  const expect = '"?"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "@"', () => {
  const actual = parseHelper('"@"');
  const expect = '"@"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "["', () => {
  const actual = parseHelper('"["');
  const expect = '"["';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "]"', () => {
  const actual = parseHelper('"]"');
  const expect = '"]"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "^"', () => {
  const actual = parseHelper('"^"');
  const expect = '"^"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "_"', () => {
  const actual = parseHelper('"_"');
  const expect = '"_"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "`"', () => {
  const actual = parseHelper('"`"');
  const expect = '"`"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "{"', () => {
  const actual = parseHelper('"{"');
  const expect = '"{"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "}"', () => {
  const actual = parseHelper('"}"');
  const expect = '"}"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "~"', () => {
  const actual = parseHelper('"~"');
  const expect = '"~"';
  assertEquals(actual, expect);
});

Deno.test('read of strings: "!"', () => {
  const actual = parseHelper('"!"');
  const expect = '"!"';
  assertEquals(actual, expect);
});

/**
 * reader errors
 */
Deno.test("reader errors: (1 2", () => {
  assertThrows(() => {
    parseHelper("(1 2");
  });
});

Deno.test("reader errors: [1 2", () => {
  assertThrows(() => {
    parseHelper("[1 2");
  });
});

/**
 * These should throw some error with no return value
 */
Deno.test('These should throw some error with no return value: "abc', () => {
  assertThrows(() => {
    parseHelper('"abc');
  });
});

Deno.test('These should throw some error with no return value: "', () => {
  assertThrows(() => {
    parseHelper('"');
  });
});

Deno.test('These should throw some error with no return value: "\\"', () => {
  assertThrows(() => {
    const s = String.raw`"\"`;
    parseHelper(s);
  });
});

Deno.test('These should throw some error with no return value: "\\\\\\\\\\\\\\\\\\"', () => {
  assertThrows(() => {
    const s = String.raw`"\\\\\\\\\\\\\\\\\\\"`;
    parseHelper(s);
  });
});

Deno.test('These should throw some error with no return value: (1 "abc', () => {
  assertThrows(() => {
    parseHelper('(1 "abc');
  });
});

Deno.test('These should throw some error with no return value: (1 "abc"', () => {
  assertThrows(() => {
    parseHelper('(1 "abc"');
  });
});

/**
 * read of quoting
 */
Deno.test("read of quoting: '1", () => {
  const actual = parseHelper("'1");
  const expect = "(quote 1)";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: '(1 2 3)", () => {
  const actual = parseHelper("'(1 2 3)");
  const expect = "(quote (1 2 3))";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: `1", () => {
  const actual = parseHelper("`1");
  const expect = "(quasiquote 1)";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: ~1", () => {
  const actual = parseHelper("~1");
  const expect = "(unquote 1)";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: ~(1 2 3)", () => {
  const actual = parseHelper("~(1 2 3)");
  const expect = "(unquote (1 2 3))";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: `(1 ~a 3)", () => {
  const actual = parseHelper("`(1 ~a 3)");
  const expect = "(quasiquote (1 (unquote a) 3))";
  assertEquals(actual, expect);
});

Deno.test("read of quoting: ~@(1 2 3)", () => {
  const actual = parseHelper("~@(1 2 3)");
  const expect = "(splice-unquote (1 2 3))";
  assertEquals(actual, expect);
});

/**
 * keywords
 */
Deno.test("keywords: :kw", () => {
  const actual = parseHelper(":kw");
  const expect = ":kw";
  assertEquals(actual, expect);
});

Deno.test("keywords: (:kw1 :kw2 :kw3)", () => {
  const actual = parseHelper("(:kw1 :kw2 :kw3)");
  const expect = "(:kw1 :kw2 :kw3)";
  assertEquals(actual, expect);
});
