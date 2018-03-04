import test from '../tap';
import tmpl from './index.njk';

test(`003: loads macros/templates from options.importPaths`, t => {
  const res = tmpl.render({msg: 'MY_EXAMPLE_CONTENT'});

  t.equal(res, `<div id="layout">\n  \n  \n<div id="thing1" class="macro">MY_EXAMPLE_CONTENT</div>\n\n\n</div>\n`);
});

