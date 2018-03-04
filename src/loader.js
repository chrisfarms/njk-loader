const fs = require('fs');
const path = require('path');
const {getOptions,parseQuery} = require('loader-utils');
const validateOptions = require('schema-utils');
const nunjucks = require('nunjucks');
const {transform} = require('nunjucks/src/transformer');
const {Environment} = require('nunjucks/src/environment');
const nodes = require('nunjucks/src/nodes');
const optionsSchema = require('./schema.json');

async function _resolvePath(ctx, opts, templatePath, context) {
  let parentPath;
  if (context && context.length > 0) {
    for (let i = 0; i < context.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      parentPath = await resolvePath(ctx, opts, context[i], parentPath ? [parentPath] : []);
    }
  }
  return new Promise((resolve, reject) => {
    ctx.resolve(parentPath ? path.dirname(parentPath) : ctx.context, templatePath, (err, resolvedPath) => {
      if (err) {
        return reject(err);
      }
      ctx.addDependency(resolvedPath);
      resolve(resolvedPath);
    });
  });
}

async function resolvePath(ctx, opts, templatePath, context) {
  if (!templatePath) {
    /* istanbul ignore next */
    throw new Error(`Can't resolve path: ""`);
  }
  let _err;
  try {
    return await _resolvePath(ctx, opts, templatePath, context);
  } catch (err) {
    _err = err;
  }
  switch (templatePath[0]) {
    case '~':
    case '/':
    case '.':
      return _resolvePath(ctx, opts, templatePath, context);
    default:
      /* istanbul ignore if */
      if (opts.includePaths.length === 0) {
        throw new Error(`Can't resolve "${templatePath}". HINT: use relative imports ('./') or node_modules imports ('~') or set 'includePaths' option to add search paths`);
      }
      for (let i = 0; i < opts.includePaths.length; i++) {
        const root = opts.includePaths[i];
        try {
          // eslint-disable-next-line no-await-in-loop
          return await _resolvePath(ctx, opts, path.join(root, templatePath), context);
        } catch (err) {
          /* istanbul ignore next */
          _err = err;
          /* istanbul ignore next */
          continue;
        }
      }
      /* istanbul ignore next */
      throw new Error(`Can't resolve "${templatePath}" from "${context.reverse().join(' from ')}" in any of [\n  ${opts.includePaths.join(',\n  ')}\n]: ${_err.message || _err}`);
  }
}

// Return list of all template files we need by parsing the
// njk templates and finding all the import/extend/include calls
async function getTemplatePaths(ctx, opts, templatePath, context) {
  const templates = {};
  const resolvedPath = await resolvePath(ctx, opts, templatePath, context);
  templates[context.concat(templatePath).join(':')] = resolvedPath;
  const source = fs.readFileSync(resolvedPath).toString();
  const ast = transform(nunjucks.parser.parse(source));
  const templateNodes = [];
  ast.findAll(nodes.Extends, templateNodes);
  ast.findAll(nodes.Include, templateNodes);
  ast.findAll(nodes.FromImport, templateNodes);
  ast.findAll(nodes.Import, templateNodes);
  for (let i = 0; i < templateNodes.length; i++) {
    const templateNode = templateNodes[i].template;
    /* istanbul ignore if */
    if (!templateNode || !templateNode.value) {
      throw new Error(`bad template path in ${ctx.resourcePath}: ${JSON.stringify(templateNodes[i])}`);
    }
    // eslint-disable-next-line no-await-in-loop
    const children = await getTemplatePaths(ctx, opts, templateNode.value, context.concat(templatePath));
    for (const k in children) {
      /* istanbul ignore if */
      if (templates[k] && templates[k] !== children[k]) {
        throw new Error(`ambiguous template name: "${k}" refers to\n${templates[k]}\n AND \n${children[k]}\nUnfortunatly this is a shortcoming of the njk-loader.`);
      }
      templates[k] = children[k];
    }
  }
  return templates;
}

async function pitch(ctx, opts, _remainingRequest) {
  const importsLoader = ctx.target === 'web' ? '' : 'imports-loader?window=>{}!';
  const slim = ctx.loaderIndex === ctx.loaders.length - 1 ? '-slim' : '';
  ctx.data.runtimePath = `${importsLoader}nunjucks/browser/nunjucks${slim}`;
  if (opts.mode === 'compile') {
    return;
  }
  const resolvedPath = await resolvePath(ctx, opts, ctx.resourcePath, []);
  const templates = await getTemplatePaths(ctx, opts, resolvedPath, []);
  const configure = opts.configure ? `import configure from '${opts.configure}'` : `function configure(env) {return env}`;
  const outputSource = `
    import { Environment } from '${ctx.data.runtimePath}';
    ${configure};
    const templates = {
      ${Object.keys(templates).map(name => `
        "${name}": require('${templates[name]}?mode=compile&name=${name}')
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
      if (typeof tmpl === 'string') {
        return {
          src: tmpl,
          path: name,
          noCache: true
        };
      }
      if (typeof tmpl !== 'object' || !tmpl.root) {
        throw new Error('error loading precompiled template:\\n    expected: a precompiled object\\n    received: ' + JSON.stringify(tmpl) + '\\nmaybe another webpack loader modified the source');
      }
      return {
        src: {
          type: 'code',
          obj: tmpl
        },
        path: name,
        noCache: true,
      };
    }
    Loader.prototype.isRelative = function(templateName) {
      return true;
    }
    Loader.prototype.resolve = function(parentName, templateName) {
      return [parentName, templateName].join(':');
    }

    const hmrThing = '${new Date()}';
    const env = new Environment(new Loader(), ${JSON.stringify(getEnvironmentOptions(opts))});
    configure(env);

    export function render(o) {
      return env.render('${ctx.resourcePath}', o);
    }
    export default {render};
  `;
  return outputSource;
}

// eslint-disable-next-line max-params
async function load(ctx, opts, source, _map, _meta) {
  /* istanbul ignore if */
  if (opts.mode !== 'compile') {
    throw new Error('njk-loader: pitch failed to prevent loader - this should never happen');
  }

  // If we're not the first loader or precompile is disabled, then we can't precompile or use slim
  if (opts.precompile === false || ctx.loaderIndex !== ctx.loaders.length - 1) {
    if (opts.precompile === true) {
      throw new Error(`njk-loader: cannot load ${ctx.resourcePath} because fallback to runtime compilation is disabled by precompile:true. use precompile:'auto' or ensure njk-loader is the first loader to run`);
    }
    return {source};
  }

  source = nunjucks.precompileString(source, {
    name: opts.name || ctx.resourcePath,
    wrapper: (templates, _opts) => {
      return `
        const { runtime } = require('${ctx.data.runtimePath}');
        module.exports = (function(){
          ${templates[0].template};
        })();
      `;
    },
    env: new Environment([], getEnvironmentOptions(opts)),
  });

  return {source};
}

function getEnvironmentOptions(opts) {
  const environmentOptions = {
    autoescape: opts.autoescape === false ? false : true,
    throwOnUndefined: opts.throwOnUndefined === true,
    trimBlocks: opts.trimBlocks === true,
    lstripBlocks: opts.lstripBlocks === true,
    opts: {},
  };
  if (opts.tags) {
    environmentOptions.tags = opts.tags
  }
  return environmentOptions;
}


function getOpts(ctx) {
  const loaderOpts = getOptions(ctx);
  const opts = {...loaderOpts};
  if (!Array.isArray(opts.includePaths)) {
    opts.includePaths = [];
  }
  validateOptions(optionsSchema, opts, 'njk-loader');
  if (ctx.resourceQuery) {
    const params = parseQuery(ctx.resourceQuery);
    opts.mode = params.mode;
    opts.name = params.name;
  }
  return opts;
}

function loader(source, map, meta) {
  const opts = getOpts(this);
  const done = this.async();
  if (this.cacheable) {
    this.cacheable();
  }
  load(this, opts, source, map, meta).then(out => done(null, out.source, out.map, out.meta)).catch(done);
}

function pitcher(remainingRequest) {
  const ctx = this;
  const done = this.async();
  const opts = getOpts(ctx);
  if (this.cacheable) {
    this.cacheable();
  }
  return pitch(ctx, opts, remainingRequest).then(out => {
    if (out) {
      return done(null, out);
    }
    done();
  }).catch(done);
}

module.exports = loader;
module.exports.pitch = pitcher;
