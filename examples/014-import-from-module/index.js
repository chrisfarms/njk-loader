import test from '../tap';
import tmpl from './index.njk';

test(`014: importing from node_modules`, t => {
  const res = tmpl.render();
  t.equal(res, '\n  \n<div id="box" class="macro">BOXY</div>\n\n');
});

