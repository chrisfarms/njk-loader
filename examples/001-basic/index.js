import test from '../tap';
import tmpl from './index.njk';

test(`001: render a basic template`, t => {
  const res = tmpl.render({name: 'World'});
  t.equal(res, 'Hello, World\n');
});

