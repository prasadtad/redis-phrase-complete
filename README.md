# redis-phrase-complete
A redis autocomplete library that allows phrase search

[![Build Status](https://travis-ci.org/recipeshelf/redis-phrase-complete.png?branch=master)](https://travis-ci.org/recipeshelf/redis-phrase-complete)

[![NPM](https://nodei.co/npm/rediscomplete.png?downloads=true)](https://www.npmjs.com/package/redis-phrase-complete)

## Installation

npm install redis-phrase-complete

## Usage

```
const RedisPhraseComplete = require('redis-phrase-complete')

const redisPhraseComplete = new RedisPhraseComplete(6379, 'localhost', {namespace: 'AutoComplete'})

redisPhraseComplete.whenAdd('The quick brown fox jumps over the lazy dog', '1')
                   .then(() => redisPhraseComplete.whenFind('brown fox'))
                   .then(ids => console.log(ids))
                   .then(redisPhraseComplete.whenQuit)
```
