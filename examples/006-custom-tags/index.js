import test from '../tap';
import tmpl from './index.njk';

test(`006: custom tag syntax`, t => {
  const res = tmpl.render({name: 'World'});
  t.equal(res, '123');
});

