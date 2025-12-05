module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import", "html"],
  experiments: { asyncWebAssembly: true },
  performance: { // prevents the automerge wasm blob from generating warnings
     hints: false,
     maxEntrypointSize: 512000,
     maxAssetSize: 512000
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ],
  rules: {
    "no-undef": "off",
    // disable the rule for all files
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "import/named": "off",
    "import/no-unresolved": "off",
  },
};
