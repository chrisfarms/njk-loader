import test from '../tap';
import tmpl from './index.njk';

test(`002: render a template that extends a layout`, t => {
  const res = tmpl.render({name: 'World'});
  t.equal(res, '<h1>Hello, World</h1>\n');
});

