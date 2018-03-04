import test from '../tap';
import tmpl from './index.njk';

test(`011: set a global variable`, t => {
  const res = tmpl.render();
  t.equal(res, 'Hello, World\n');
});

