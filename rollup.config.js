import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

export default [
  // CommonJS build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      peerDepsExternal(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      resolve(),
      commonjs(),
    ],
    external: ["react", "react-dom", "vue"],
  },
  // ES module build
  {
    input: "src/index.js",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
      exports: "named",
    },
    plugins: [
      peerDepsExternal(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      resolve(),
      commonjs(),
    ],
    external: ["react", "react-dom", "vue"],
  },
  // Minified browser bundle
  {
    input: "src/index.js",
    output: {
      file: "dist/index.umd.js",
      format: "umd",
      name: "I18nClient",
      exports: "named",
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        vue: "Vue",
      },
    },
    plugins: [
      peerDepsExternal(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      resolve({
        browser: true,
      }),
      commonjs(),
      terser(),
    ],
    external: ["react", "react-dom", "vue"],
  },
];
