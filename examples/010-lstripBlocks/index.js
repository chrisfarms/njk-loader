import test from '../tap';
import lstripBlocksEnabled from './index.enabled.njk';
import lstripBlocksDisabled from './index.disabled.njk';

test(`010: lstripBlocks to remove leading whitespace from a block/tag`, t => {
  const untrimmed = lstripBlocksDisabled.render();
  t.equal(untrimmed, '                                        123\n')
  const trimmed = lstripBlocksEnabled.render();
  t.equal(trimmed, '123\n');
});

