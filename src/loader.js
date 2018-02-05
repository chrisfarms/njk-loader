const { getOptions } = require('loader-utils')
const nunjucks = require('nunjucks')
const { transform } = require('nunjucks/src/transformer')
const nodes = require('nunjucks/src/nodes')
const fs = require('fs')
const path = require('path')

async function _resolvePath (ctx, opts, templatePath, context) {
  let parentPath
  if (context && context.length > 0) {
    for (let i = 0; i < context.length; i++) {
      parentPath = await resolvePath(ctx, opts, context[i], parentPath ? [parentPath] : [])
    }
  }
  return new Promise((resolve, reject) => {
    ctx.resolve(parentPath ? path.dirname(parentPath) : ctx.context, templatePath, (err, resolvedPath) => {
      if (err) {
        return reject(err)
      }
      resolve(resolvedPath)
    })
  })
}

async function resolvePath (ctx, opts, templatePath, context) {
  if (!templatePath) {
    throw new Error(`Can't resolve path: ""`)
  }
  let err
  try {
    return await _resolvePath(ctx, opts, templatePath, context)
  } catch (e) {
    err = e
  }
  switch (templatePath[0]) {
    case '~':
    case '/':
    case '.':
      return _resolvePath(ctx, opts, templatePath, context)
    default:
      if (opts.includePaths.length === 0) {
        throw new Error(`Can't resolve "${templatePath}". HINT: use relative imports ('./') or node_modules imports ('~') or set 'includePaths' option to add search paths`)
      }
      for (let i = 0; i < opts.includePaths.length; i++) {
        const root = opts.includePaths[i]
        try {
          return await _resolvePath(ctx, opts, path.join(root, templatePath), context)
        } catch (e) {
          err = e
          continue
        }
      }
      throw new Error(`Can't resolve "${templatePath}" from "${context.reverse().join(' from ')}" in any of [\n  ${opts.includePaths.join(',\n  ')}\n]: ${err.message || err}`)
  }
}

// return list of all template files we need by parsing the
// njk templates and finding all the import/extend/include calls
async function getTemplatePaths (ctx, opts, templatePath, context) {
  const templates = {}
  const resolvedPath = await resolvePath(ctx, opts, templatePath, context)
  templates[ context.concat(templatePath).join(':') ] = resolvedPath
  const source = fs.readFileSync(resolvedPath).toString()
  const ast = transform(nunjucks.parser.parse(source))
  const templateNodes = []
  ast.findAll(nodes.Extends, templateNodes)
  ast.findAll(nodes.Include, templateNodes)
  ast.findAll(nodes.FromImport, templateNodes)
  ast.findAll(nodes.Import, templateNodes)
  for (let i = 0; i < templateNodes.length; i++) {
    const templateNode = templateNodes[i].template
    if (!templateNode || !templateNode.value) {
      throw new Error(`bad template path in ${ctx.resourcePath}: ${JSON.stringify(templateNodes[i])}`)
    }
    const children = await getTemplatePaths(ctx, opts, templateNode.value, context.concat(templatePath))
    for (let k in children) {
      if (templates[k] && templates[k] !== children[k]) {
        throw new Error(`ambiguous template name: "${k}" refers to\n${templates[k]}\n AND \n${children[k]}\nUnfortunatly this is a shortcoming of the njk-loader.`)
      }
      templates[k] = children[k]
    }
  }
  return templates
}

async function pitch (ctx, opts, remainingRequest) {
  if (opts.mode === 'compile') {
    return
  }
  const resolvedPath = await resolvePath(ctx, opts, ctx.resourcePath, [])
  const templates = await getTemplatePaths(ctx, opts, resolvedPath, [])
  const outputSource = `
    import { Environment, Template } from 'nunjucks/src/environment';
    const templates = {
      ${Object.keys(templates).map((name) => `
        "${name}": require('${templates[name]}?mode=compile')
      `).join(',')}
    }
    function Loader(){};
    Loader.prototype.getSource = function(name) {
      let tmpl = templates[name];
      if (!tmpl) {
        throw new Error('no njk template: '+name);
      }
      if (typeof tmpl === 'object' && tmpl.default) {
        tmpl = tmpl.default;
      }
      if (typeof tmpl === 'function') {
        tmpl = tmpl();
      }
      if (typeof tmpl !== 'string') {
        throw new Error('template ' + name + ' did not return a string, maybe another webpack loader messed with the source');
      }
      return {
        src: tmpl,
        path: name,
        noCache: false,
      };
    }
    Loader.prototype.isRelative = function(templateName) {
      return true;
    }
    Loader.prototype.resolve = function(parentName, templateName) {
      return [parentName, templateName].join(':');
    }
    const _render = (function(){
      const env = new Environment(new Loader(), {
        autoescape: true,
      });
      const tmpl = new Template(templates['${ctx.resourcePath}'], env, '${ctx.resourcePath}', true);
      return function(o) {
        return tmpl.render(o);
      }
    })();
    export function render(o) {
      return _render(o);
    }
    export default render;
  `
  return outputSource
}

async function load (ctx, opts, source, map, meta) {
  if (ctx.loaderIndex === ctx.loaders.length - 1) {
    source = `export default ${JSON.stringify(source)}`
  }
  if (opts.mode !== 'compile') {
    throw new Error('njk-loader: pitch failed to prevent loader - this should never happen')
  }
  return { source }
}

function getOpts (ctx) {
  const loaderOpts = getOptions(ctx)
  const opts = {...loaderOpts}
  if (/mode=compile/.test(ctx.resourceQuery)) {
    opts.mode = 'compile'
  }
  if (!Array.isArray(opts.includePaths)) {
    opts.includePaths = []
  }
  return opts
}

function loader (source, map, meta) {
  const opts = getOpts(this)
  const done = this.async()
  this.cacheable && this.cacheable()
  load(this, opts, source, map, meta).then(out => done(null, out.source, out.map, out.meta)).catch(done)
}

function pitcher (remainingRequest) {
  const ctx = this
  const done = this.async()
  const opts = getOpts(ctx)
  this.cacheable && this.cacheable()
  return pitch(ctx, opts, remainingRequest).then(out => {
    if (out) return done(null, out)
    done()
  }).catch(done)
}

module.exports = loader
module.exports.pitch = pitcher
