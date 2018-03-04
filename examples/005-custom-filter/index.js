import test from '../tap';
import tmpl from './index.njk';

test(`005: configure and use a custom rot13 filter`, t => {
  const res = tmpl.render({encodedName: 'Jbeyq'});
  t.equal(res, 'Hello, World\n');
});

