module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:@typescript-eslint/recommended", "prettier", "prettier/@typescript-eslint"],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/prefer-interface": "off",
    "no-use-before-define": "off",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "prettier/prettier": [
      "error",
      {
        "printWidth": 120
      }
    ],
  },
  parserOptions: {
    parser: "@typescript-eslint/parser"
  }
};
