# Equation grapher in WebGL

<p float="left">
  <img src="cool_function.png" width="49%" />
  <img src="cool_parametric_func.png" width="49%" />
</p>

GPU-accelerated equation parser and grapher built in WebGL. Equations are parsed into [S-expressions ](https://en.wikipedia.org/wiki/S-expression) with [Pratt parsing](https://en.wikipedia.org/wiki/Operator-precedence_parser#Pratt_parsing) algorithm and evaluated on the GPU.

When evaluating the S-expression, each operator and function is replaced with a respective GLSL function and later compiled into a unique vertex shader.

The parser(s) work(s) with the following operators: `+`, `-`, `*`, `/`, `^`, functions: `sin`, `cos`, `tan`, `sqrt`, `exp`, `ln`, `abs` and parentheses.

Besides standard functions one can specify parametric functions and set the interval.
