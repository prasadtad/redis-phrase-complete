// index.js

const _ = require('lodash')

require('util.promisify/shim')()
const redis = require('redis-promisify')

module.exports = class RedisPhraseComplete {
    constructor(options) {
        options = options || {}
        this.namespace = options.namespace || 'AutoComplete'
        this.client = options.client || (options.endpoint ? redis.createClient(options.endpoint) : redis.createClient(options.port || 6379, options.host || 'localhost'))
        _.bindAll(this, 'getKey', 'whenAddRemove', 'whenAdd', 'whenRemove', 'whenRemoveAll', 'whenScan', 'whenFind', 'whenQuit')
    }

    getKey(phrase) {
        return this.namespace + ':' + phrase
    }

    getPhrases(sentence)
    {
        if (!sentence) return []
        let phrases = _.words(sentence.toLowerCase())
        phrases = _.filter(phrases, p => p && p.length > 0)        
        for (let i = phrases.length - 2; i >= 0; i--)
            phrases[i] = (phrases[i] + ' ' + phrases[i + 1]).trim()
        return phrases        
    }

    whenAddRemove(sentence, id, add) {
        const transaction = this.client.multi()
        for (const phrase of this.getPhrases(sentence))
            add ? transaction.hset(this.getKey(phrase), sentence, id) : transaction.hdel(this.getKey(phrase), sentence)
        return transaction.execAsync()
    }

    whenAdd(sentence, id) {
        return this.whenAddRemove(sentence, id, true)
    }

    whenRemove(sentence, id) {
        return this.whenAddRemove(sentence, id, false)
    }

    whenRemoveAll() {
        return this.whenScan('0', [], this.namespace + ':*')
                    .then(keys => keys && keys.length > 0 ? this.client.delAsync(...keys) : Promise.resolve())                    
    }

    whenScan(cursor, results, pattern) { 
        const args = [cursor]
        if (pattern) {
            args.push('MATCH')
            args.push(pattern)
        }
        args.push('COUNT')
        args.push(100)
        return this.client.scanAsync(...args)
                .then(r => {
                    results.push(...r[1])
                    if (r[0] === '0') return Promise.resolve(results)                        
                    return this.whenScan(r[0], results, pattern)
                })
    }

    whenFind(searchPhrase) {
        searchPhrase = searchPhrase.toLowerCase()
        return this.whenScan('0', [], this.getKey(searchPhrase) + '*')
                    .then(keys => Promise.all(_.map(keys, key => this.client.hgetallAsync(key))))
                    .then(allFieldValues => {
                        const results = []
                        for (const fieldValues of allFieldValues)
                        {
                            for (const field of _.keys(fieldValues))
                                results.push({ sentence: field, id: fieldValues[field] })
                        }
                        return Promise.resolve(results)
                    })                
    }
   
    whenQuit() { return this.client.quitAsync() }    
}
