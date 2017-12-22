const RedisPhraseComplete = require('./index')

const redisPhraseComplete = new RedisPhraseComplete({ namespace: 'AutoCompleteTest'})

const _ = require('lodash')

const assert = require('assert')

redisPhraseComplete.whenRemoveAll()
.then(() => {
    const sentences = [
        [ 'For the love of money is the root of all evil.', '1'],
        [ 'Lack of money is the root of all evil!', '2'],
        [ 'Having only one-dollar a day is the root of all evil', '3'],
        [ 'Just having only one-dollar a day is the root of all evil', '3']
    ]
    
    return Promise.all(_.map(sentences, s => redisPhraseComplete.whenAdd(s[0], s[1])))
        .then(() => {
            const checks = {
                'for the love': ids => assert.deepEqual(ids, [ { sentence: 'For the love of money is the root of all evil.', id: '1' } ]),
                'money is the root': ids => assert.deepEqual(ids, [ { sentence: 'For the love of money is the root of all evil.', id: '1' }, { sentence: 'Lack of money is the root of all evil!', id: '2' } ]),
                'only one dollar': ids => assert.deepEqual(ids, [ { sentence: 'Having only one-dollar a day is the root of all evil', id: '3' }, { sentence: 'Just having only one-dollar a day is the root of all evil', id: '3' } ])
            }
            const keys = _.keys(checks)
            return Promise.all(_.map(keys, redisPhraseComplete.whenFind))
                    .then(results => {
                        _.zipWith(keys, results, (k, ids) => checks[k](ids.sort()))
                        return Promise.resolve()
                    })
        })
})
.then(() => redisPhraseComplete.whenRemove('For the love of money is the root of all evil.', '1')
                .then(() => redisPhraseComplete.whenFind('for the love')
                    .then(results => {
                        assert.deepEqual(results, [])
                        return Promise.resolve()
                    })))
.then(redisPhraseComplete.whenQuit)
.then(() => {
    console.info('Tests - passed')
    process.exit()
})