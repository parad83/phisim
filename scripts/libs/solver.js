import { shunting_yard } from "./shunting_yard.js";
import { Queue, Stack } from "./dt.js";
import { isVariable, isOperator, isUnary, OPERATORS } from "./misc.js";

// neg a
// a neg
// s = [a]
//
function getBrackets(rnp) {
  console.log(rnp);
  var s = new Stack();
  while (!rnp.isEmpty()) {
    const t = rnp.dequeue();
    if (isVariable(t)) {
      s.push(t);
    } else if (isOperator(t)) {
      if (isUnary(t)) {
        const a = s.pop();
        s.push(`( ${t} ${a})`);
      } else {
        const a = s.pop();
        const b = s.pop();
        s.push(`(${b} ${t} ${a})`);
      }
    }
  }
  return s.top();
}

function buildMap(tokens) {
  var values = new Set();
  for (var t of tokens) {
    if (isVariable(t)) values.add(t);
  }
  return new Map([...values].map((v) => [v, 0]));
}

// increments binary number stored in map by 1
// up to 2**53 - 1 variables (stack will probably overflow tho lol)
function incrementMap(map) {
  var num = parseInt(Array.from(map.values()).join(""), 2);
  const keys = Array.from(map.keys());
  const width = keys.length;

  // and the result to only get keys.length bits
  const mask = (1 << width) - 1;
  num = (num + 1) & mask;

  return new Map(
    num
      .toString(2)
      .padStart(keys.length, "0")
      .split("")
      .map((v, i) => [keys[i], parseInt(v)])
  );
}

function solveAll(tokens) {
  var vars_map = buildMap(tokens);
  const rowscnt = 2 ** vars_map.size;
  var results = Array(rowscnt);
  const rnp = shunting_yard(tokens);

  console.log(rnp);
  console.log(rnp.copy());
  const expr = getBrackets(rnp.copy());

  for (let i = 0; i < rowscnt; i++) {
    var row = new Array(2);
    row[0] = vars_map;
    row[1] = solve(rnp, vars_map);
    results[i] = row;
    vars_map = incrementMap(vars_map);
  }
  return [expr, results];
}

// takes RPN queue as input
function solve(q, vars) {
  const a = q.flat();
  var s = new Stack();
  for (let i = 0; i < a.length; i++) {
    const t = a[i];
    if (isVariable(t)) {
      var v = vars.get(t);
      s.push(v);
    } else if (isOperator(t)) {
      if (isUnary(t)) {
        // only takes one element from the stack
        const a = s.pop();
        s.push(OPERATORS[t](a));
      } else {
        // takes two arguments
        const b = s.pop();
        const a = s.pop();
        // order doesnt matter for and, or
        // TODO: think how popping form the stack takes effect for subtracting, if extending for algebra
        s.push(OPERATORS[t](a, b));
      }
    }
  }

  // with xor it sometimes returns false or true
  return Number(s.pop());
}

// // const i = ["neg", "(", "a", "or", "b", ")"];
// const i = ["a", "or", "b"];
// // const i = ["neg", "p"];
// // console.log(buildMap(i));
// // console.log(i);
// // const s = shunting_yard(i);
// // console.log(s);
// // console.log(solve(s));
// // // console.log(r.top());
// console.log(solveAll(i));

export { solveAll };
