import test from '../tap';
import autoescapeEnabled from './index.enabled.njk';
import autoescapeDisabled from './index.disabled.njk';

test(`007: disabling autoescape`, t => {
  const data = {unsafe: '<script>alert("unsafe")</script>'};
  const escaped = autoescapeEnabled.render(data);
  t.equal(escaped, '&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;');
  const unescaped = autoescapeDisabled.render(data);
  t.equal(unescaped, '<script>alert("unsafe")</script>');
});

