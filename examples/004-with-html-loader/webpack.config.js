module.exports = {

  module: {
    rules: [
      {
        test: /\.(njk|html)$/,
        use: [
          {
            loader: 'njk-loader'
          },
          {
            loader: 'html-loader',
            options: {
              attrs: ['link:href']
            }
          }
        ]
      },
      {
        test: /\.(css)$/,
        use: [
          {
            loader: 'file-loader'
          }
        ]
      }
    ]
  }

};
