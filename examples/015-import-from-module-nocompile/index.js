import test from '../tap';
import tmpl from './index.njk';

test(`015: importing from node_modules without precompiling`, t => {
  const res = tmpl.render();
  t.equal(res, '\n  \n<div id="box" class="macro">BOXY</div>\n\n');
});

