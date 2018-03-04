const path = require('path');

module.exports = {

  module: {
    rules: [
      {
        test: /\.njk$/,
        use: [
          {
            loader: 'njk-loader',
            options: {
              includePaths: [path.resolve(__dirname, 'some/path/for/relative/includes')]
            }
          }
        ]
      }
    ]
  }

};
