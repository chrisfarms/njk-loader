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
              configure: path.resolve(__dirname, './nunjucks.config.js')
            }
          }
        ]
      }
    ]
  }

};
