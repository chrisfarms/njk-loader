import jmespath from 'jmespath';

export default function configure(env) {

  env.addFilter('jq', function(data, query) {
    return jmespath.search(data, query);
  });

}
