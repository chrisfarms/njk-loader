module.exports = {

  module: {
    rules: [
      {
        test: /\.njk$/,
        use: [
          {
            loader: 'njk-loader',
            options: {
              precompile: false
            }
          }
        ]
      }
    ]
  }

};
