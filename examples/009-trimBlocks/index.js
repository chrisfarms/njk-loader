import test from '../tap';
import trimBlocksEnabled from './index.enabled.njk';
import trimBlocksDisabled from './index.disabled.njk';

test(`009: enable trimBlocks to trailing newlines from a block/tag`, t => {
  const untrimmed = trimBlocksDisabled.render();
  t.equal(untrimmed, '[\n0,\n1,\n2,\n3,\n4,\n5,\n6,\n7,\n8,\n9,10]\n');
  const trimmed = trimBlocksEnabled.render();
  t.equal(trimmed, '[0,1,2,3,4,5,6,7,8,9,10]\n');
});

