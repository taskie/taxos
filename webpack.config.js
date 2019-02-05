/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

module.exports = {
  entry: {
    taxos: "./src/cli/index.ts"
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ["ts-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.hbs$/,
        use: ["handlebars-loader"],
        exclude: /node_modules/
      },
      {
        test: /\.txt$/,
        use: ["raw-loader"],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  cache: true
};
