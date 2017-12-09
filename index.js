// index.js

const _ = require('lodash')

require('util.promisify/shim')()
const redis = require('redis-promisify')

module.exports = class RedisPhraseComplete {
    constructor(options) {
        options = options || {}
        this.namespace = options.namespace || 'AutoComplete'
        this.client = options.client || redis.createClient(options.port || 6379, options.host || 'localhost')
        this.getKey = this.getKey.bind(this)
        this.whenSetOp = this.whenSetOp.bind(this)
        this.whenAdd = this.whenAdd.bind(this)
        this.whenRemove = this.whenRemove.bind(this)
        this.whenRemoveAll = this.whenRemoveAll.bind(this)
        this.whenScan = this.whenScan.bind(this)
        this.whenFind = this.whenFind.bind(this)
        this.whenQuit = this.whenQuit.bind(this)        
    }

    getKey(phrase) {
        return this.namespace + ':' + phrase
    }

    getPhrases(sentence)
    {
        if (!sentence) return []
        let phrases = sentence.toLowerCase().split(/[(),!\\.-\s]+/g)
        phrases = _.filter(phrases, p => p && p.length > 0)        
        for (let i = phrases.length - 2; i >= 0; i--)
            phrases[i] = (phrases[i] + ' ' + phrases[i + 1]).trim()
        return phrases        
    }

    whenSetOp(sentence, id, add) {
        const transaction = this.client.multi()
        for (const phrase of this.getPhrases(sentence))
            add ? transaction.sadd(this.getKey(phrase), id) : transaction.srem(this.getKey(phrase), id)
        return transaction.execAsync()
    }

    whenAdd(sentence, id) {
        return this.whenSetOp(sentence, id, true)
    }

    whenRemove(sentence, id) {
        return this.whenSetOp(sentence, id, false)
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
                    .then(keys => Promise.all(_.map(keys, key => this.client.smembersAsync(key)))
                                        .then(ids => Promise.resolve(_.uniq(_.flatten(ids)))))
    }
   
    whenQuit() { return this.client.quitAsync() }    
}
