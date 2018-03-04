import test from '../tap';
import tmpl from './index.njk';

test(`013: disable precompile`, t => {
  t.equal(tmpl.render({name: 'World'}), 'Hello, World\n');
});

