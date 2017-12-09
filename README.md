# redis-phrase-complete
A redis autocomplete library that allows phrase search

[![Build Status](https://travis-ci.org/recipeshelf/redis-phrase-complete.png?branch=master)](https://travis-ci.org/recipeshelf/redis-phrase-complete)

[![NPM](https://nodei.co/npm/rediscomplete.png?downloads=true)](https://www.npmjs.com/package/redis-phrase-complete)

## Installation

npm install redis-phrase-complete

## Usage

```
const RedisPhraseComplete = require('redis-phrase-complete')

const redisPhraseComplete = new RedisPhraseComplete({ port: 6379, host: 'localhost', namespace: 'AutoCompleteTest'})

redisPhraseComplete.whenAdd('The quick brown fox jumps over the lazy dog', '1')
                   .then(() => redisPhraseComplete.whenFind('brown fox'))
                   .then(ids => console.log(ids))
                   .then(redisPhraseComplete.whenQuit)                   
```
## Api

### new RedisPhraseComplete(options)

If options aren't passed, it uses defaults.

- port: Port address for the redis instance. The default is 6379.
- host: The hostname for the redis instance. The default is localhost.
- namespace: The namespace used for the phrasecomplete index. The default is 'AutoComplete'.
- client: Use to pass in your own client.

### whenAdd(sentence, id)

Indexes the phrases of the sentence to find the id.

### whenRemove(sentence, id)

Removes the indexing of the id from the phrases of the sentence.

### whenRemoveAll()

Removes all entries under the namespace passed into the constructor.

### whenFind(searchPhrase)

Returns all ids that match, uses a searchPhrase* pattern.

### whenQuit()

Call this to quit the redis connection when you are done unless you are passing in your own client.