const path = require('path');

module.exports = {

  module: {
    rules: [
      {
        test: /\.enabled\.njk$/,
        use: [
          {
            loader: 'njk-loader',
            options: {
              trimBlocks: true
            }
          }
        ]
      },
      {
        test: /\.disabled\.njk$/,
        use: [
          {
            loader: 'njk-loader'
          }
        ]
      }
    ]
  }

};
