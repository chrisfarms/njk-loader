import test from '../tap';
import throwEnabled from './index.enabled.njk';
import throwDisabled from './index.disabled.njk';

test(`008: throwsOnUndefined`, t => {
  t.throws(() => {
    throwEnabled.render({});
  }, /undefined/, 'expected undefined variable to throw exception')
  t.doesNotThrow(() => {
    throwDisabled.render({});
  })
});

