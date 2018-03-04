import test from '../tap';
import tmpl from './index.njk';

test(`016: configure and use a jq-like data filter without precompiling`, t => {
  const res = tmpl.render({data: {
    "people": [
      {
        "general": {
          "id": 100,
          "age": 20,
          "other": "foo",
          "name": "Bob"
        },
        "history": {
          "first_login": "2014-01-01",
          "last_login": "2014-01-02"
        }
      },
      {
        "general": {
          "id": 101,
          "age": 30,
          "other": "bar",
          "name": "Bill"
        },
        "history": {
          "first_login": "2014-05-01",
          "last_login": "2014-05-02"
        }
      }
    ]
  }});
  t.deepEqual(JSON.parse(res), [
    {
      "ident":100,
      "firstName":"Bob",
      "x":true
    },{
      "ident":101,
      "firstName":"Bill",
      "x":true
    }
  ]);
});

