import path from "path";

import babel from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";

function isBareModuleId(id) {
  return !id.startsWith(".") && !path.isAbsolute(id);
}

export default function rollup() {
  return {
    external(id) {
      return isBareModuleId(id);
    },
    input: `./src/index.ts`,
    output: {
      dir: "./build",
      format: "cjs",
      preserveModules: true,
      exports: "auto"
    },
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: /node_modules/,
        extensions: [".ts"]
      }),
      nodeResolve({ extensions: [".ts"] })
    ]
  };
}
