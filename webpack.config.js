const path = require('path');

module.exports = {
  entry: {
    cli: "./src/cli/index.ts"
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      "@": path.resolve(__dirname, 'src')
    }
  },
  cache: true
};
