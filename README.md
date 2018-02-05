# njk-loader
webpack loader for nunjucks

## WIP

Not npm installable yet ... no tests to speak of ... might work if you load it directly from a path ... just a PoC for now

## Usage


Configure webpack something like:

```javascript
  module: {
    rules: [
      {
        test: /\.(njk)$/,
        use: [
          {
            loader: path.resolve(__dirname, '../src/loader.js'),
            options: {
              includePaths: [
                'some_node_module_that_contains_templates',
                path.resolve(__dirname, 'path/to/some/templates/not/in/require/path')
              ]
            }
          },
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src', 'link:href', 'script:src']
            }
          }
        ]
      },
    ]
  }
```

Use your template something like:

```javascript
const tmpl = require('./mytemplate.njk')
index.render({ name: 'Alice' })
```
