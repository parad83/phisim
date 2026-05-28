# Equation grapher in WebGL

![Cool function](cool_function.png)

GPU-accelerated equation parser and grapher built in WebGL. Equations are parsed into [S-expressions ](https://en.wikipedia.org/wiki/S-expression) with [Pratt parsing](https://en.wikipedia.org/wiki/Operator-precedence_parser#Pratt_parsing) algorithm and evaluated on the GPU.

When evaluating the S-expression, each operator and function is replaced with a respective GLSL function and later compiled into a unique vertex shader.

The parser(s) work(s) with the following operators: `+`, `-`, `*`, `/`, `^`, functions: `sin`, `cos`, `tan`, `sqrt`, `exp`, `ln`, `abs` and parentheses.
