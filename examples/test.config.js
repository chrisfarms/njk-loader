const path = require('path');
const merge = require('webpack-merge');
const glob = require('glob');

module.exports = glob.sync(path.resolve(__dirname, '**/webpack.config.js')).reduce((cfgs, f) => {
  const name = path.dirname(f);

  const common = merge({
    mode: process.env.NODE_ENV || 'development',
    entry: path.join(name, '/index.js'),
    node: {
      __filename: true
    },
    stats: 'errors-only'
  }, require(f));

  // switch out 'njk-loader' for direct path to loader
  common.module.rules = common.module.rules.map(r => {
    r.use = r.use.map(l => {
      if (l.loader == 'njk-loader') {
        l.loader = path.resolve(__dirname, '../src/loader.js');
      }
      return l;
    })
    return r;
  });

  cfgs.push(merge({
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'tests'),
      filename: `${path.basename(name)}.node.js`
    }
  }, common));

  cfgs.push(merge({
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'tests'),
      filename: `${path.basename(name)}.web.js`
    }
  }, common));

  return cfgs;
}, []);

