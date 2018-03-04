import test from '../tap';
import tmpl from './index.html';

test(`004: preprocessing template with html-loader`, t => {
  const res = tmpl.render({name: 'World'});
  t.equal(res, `<html>
  <head>
    <link href="c87ae587542d0a45c87dd77405bc7169.css">
  </head>
  <body>
    Hello, World!
  </body>
</html>\n`);
});

