import { expr } from "../pratt.js";
import { assert, printAllTests } from "../misc.js";

function test_one() {
  const input = "1";
  const expected = ["1"];
  return assert(expected, expr(input).toArray());
}

function test_add_mult() {
  // 1 + (2 * 3)
  const input = "1+2*3";
  const expected = ["+", "1", "*", "2", "3"];
  return assert(expected, expr(input).toArray());
}

function test_unary() {
  // (--1) * 2
  const input = "--1*2";
  const expected = ["*", "-", "-", "1", "2"];
  return assert(expected, expr(input).toArray());
}

function test_factorial() {
  // -(9!)
  const input = "-9!";
  const expected = ["-", "!", "9"];
  return assert(expected, expr(input).toArray());
}

const tests = { test_one, test_add_mult, test_unary, test_factorial };
printAllTests(tests);
