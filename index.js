// index.js


const _ = require('lodash')
const { createClient } = require('redis')

module.exports = class RedisPhraseComplete {
    constructor(options) {
        options = options || {}
        this.namespace = options.namespace || 'AutoComplete'
        if (options.client) {
            this.client = options.client
        } else {
            // Support endpoint (URL) or host/port
            if (options.endpoint) {
                this.client = createClient({ url: options.endpoint })
            } else {
                this.client = createClient({
                    socket: {
                        host: options.host || 'localhost',
                        port: options.port || 6379
                    }
                })
            }
            this.client.connect()
        }
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

    async whenAddRemove(sentence, id, add) {
        const transaction = this.client.multi()
        for (const phrase of this.getPhrases(sentence)) {
            if (add) {
                transaction.hSet(this.getKey(phrase), sentence, id)
            } else {
                transaction.hDel(this.getKey(phrase), sentence)
            }
        }
        return await transaction.exec()
    }

    async whenAdd(sentence, id) {
        return await this.whenAddRemove(sentence, id, true)
    }

    async whenRemove(sentence, id) {
        return await this.whenAddRemove(sentence, id, false)
    }

    async whenRemoveAll() {
        const keys = await this.whenScan('0', [], this.namespace + ':*')
        if (keys && keys.length > 0) {
            await this.client.del(...keys)
        }
    }

    async whenScan(cursor, results, pattern) {
        const options = { COUNT: 100 };
        if (pattern) {
            options.MATCH = pattern;
        }
        const res = await this.client.scan(cursor, options);
        results.push(...res.keys);
        if (res.cursor === '0') return results;
        return this.whenScan(res.cursor, results, pattern);
    }

    async whenFind(searchPhrase) {
        searchPhrase = searchPhrase.toLowerCase()
        const keys = await this.whenScan('0', [], this.getKey(searchPhrase) + '*')
        const allFieldValues = await Promise.all(keys.map(key => this.client.hGetAll(key)))
        const results = []
        for (const fieldValues of allFieldValues) {
            for (const field of _.keys(fieldValues)) {
                results.push({ sentence: field, id: fieldValues[field] })
            }
        }
        return results
    }
   
    async whenQuit() { return await this.client.quit() }
}
