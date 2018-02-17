import proclaim from 'proclaim';

const isBrowser = typeof window !== 'undefined';

function write(str) {
  console.log(str);
}

export function end(stats) {
  if (stats.skipped > 0) {
    write(`# skip ${stats.skipped}`);
  }
  write(`# fail ${stats.failed + stats.crashed + stats.todo}`);
}

function ok(idx, name) {
  write(`ok ${idx} - ${name}`);
}

function notok(idx, name, err) {
  const stack = err.stack || '';
  const msg = err.message || err.toString();
  write(`not ok ${idx} - ${name} - ${stack || msg}`);
}

export default function test(name, fn) {
  name = (isBrowser ? 'web: ' : 'node: ') + name;
  write('TAP version 13');
  write('1..1');

  let idx = 0;

  const stats = {
    passed: 0,
    failed: 0,
    crashed: 0,
    skipped: 0,
    todo: 0
  };

  idx++;

  if (idx > 1) {
    throw new Error(`you can't execute test() more than once ... it's only a very basic TAP producer`);
  }

  write(`# ${name}`);

  try {
    fn(proclaim);
    ok(idx, name);
    stats.passed++;
  } catch (err) {
    stats.failed++;
    notok(idx, name, err);
  }

  end(stats);

  if (isBrowser) {
    window.close();
  }
}
