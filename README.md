<div align="center">

<a href="https://github.com/webpack/webpack"><img width="200" height="200" src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon.svg"></a>

<h1>Nunjucks Loader</h1>

<a href="https://www.npmjs.com/package/njk-loader"><img src="https://img.shields.io/npm/dm/njk-loader.svg?maxAge=3600"></a>
<a href="https://www.npmjs.com/package/njk-loader"><img src="https://img.shields.io/npm/v/njk-loader.svg?maxAge=3600"></a>
<a href="https://travis-ci.org/chrisfarms/njk-loader"><img src="https://img.shields.io/travis/chrisfarms/njk-loader/master.svg?label=travis-ci"></a>

<br>
<br>

<a href="https://github.com/chrisfarms/njk-loader">njk-loader</a> is a <a href="https://webpack.js.org/">webpack</a> loader for <a href="https://mozilla.github.io/nunjucks">nunjucks</a> templates.

<br>
<br>

</div>

---


## Installation

```
npm install --save-dev njk-loader
```

## Usage


Enable the loader in your webpack config...

```javascript
// webpack.config.js
export default {
  module: {
    rules: [
      {
        test: /\.(njk)$/,
        use: [
          {
            loader: 'njk-loader',
            options: {
              configure: path.resolve(__dirname, './nunjucks.config.js')
              // ...see options
            }
          }
        ]
      },
    ]
  }
};
```

Optionally configure the nunjucks [environment](https://mozilla.github.io/nunjucks/api.html#environment) to add custom filters by creating a "configure" function...

```javascript
// nunjucks.config.js
export default function configure(env) {

  env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
  });

}
```

Import your template and call the render function to execute the template:

```javascript
// your.app.js
import tmpl from './template.njk';
const output = tmpl.render({ name: 'Alice' });
```

## Options

The following loader options are available:

| Name | Default | Type | Description |
|---|---|---|---|
| `includePaths` | - | Array<String> | list of search paths used when resolving locations of templates included with [extends](https://mozilla.github.io/nunjucks/templating.html#extends), [import](https://mozilla.github.io/nunjucks/templating.html#import) and [include](https://mozilla.github.io/nunjucks/templating.html#include) blocks |
| `configure` | - | String | path to a module that exports a single function that accepts a single argument (`environment`) that can be used to configure the nunjucks [environment](https://mozilla.github.io/nunjucks/api.html#environment). [See example](./examples/005-custom-filter)|
| `precompile` | 'auto' | Boolean / 'auto' | `'auto'` will precompile templates where possible and bundle the 'slim' version of the nunjucks runtime. If precompilation is not possible, like when [chaining with html-loader](./examples/004-with-html-loader), then the full runtime will be included to allow runtime compilation. Set to `true` to raise errors when it's not possible to precompile and `false` to never attempt precompilation. |
| `autoescape` | `true` | Boolean | escape potentially dangerous output |
| `throwOnUndefined ` | `false` | Boolean | throw errors when outputting a null/undefined value |
| `trimBlocks` | `false` | Boolean | automatically remove trailing newlines from a block/tag |
| `lstripBlocks` | `false` |  Boolean | automatically remove leading whitespace from a block/tag |
| `tags` | `{}` | - | [Customise syntax](https://mozilla.github.io/nunjucks/api.html#customizing-syntax) used for blocks.  |

## Examples

The tests in this repository are structured in a fairly accessible example format that you may find useful. 

[See examples](./examples)
