import test from '../tap';
import tmpl from './index.njk';

test(`012: render a template using includes`, t => {
  const res = tmpl.render({name: 'World'});
  t.equal(res, '<h1>Hello, World</h1>\n');
});

