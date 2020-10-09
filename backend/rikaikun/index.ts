import { promises as fs } from 'fs';

const ch = [
    0x3092,
    0x3041,
    0x3043,
    0x3045,
    0x3047,
    0x3049,
    0x3083,
    0x3085,
    0x3087,
    0x3063,
    0x30fc,
    0x3042,
    0x3044,
    0x3046,
    0x3048,
    0x304a,
    0x304b,
    0x304d,
    0x304f,
    0x3051,
    0x3053,
    0x3055,
    0x3057,
    0x3059,
    0x305b,
    0x305d,
    0x305f,
    0x3061,
    0x3064,
    0x3066,
    0x3068,
    0x306a,
    0x306b,
    0x306c,
    0x306d,
    0x306e,
    0x306f,
    0x3072,
    0x3075,
    0x3078,
    0x307b,
    0x307e,
    0x307f,
    0x3080,
    0x3081,
    0x3082,
    0x3084,
    0x3086,
    0x3088,
    0x3089,
    0x308a,
    0x308b,
    0x308c,
    0x308d,
    0x308f,
    0x3093,
];
const cv = [
    0x30f4,
    0xff74,
    0xff75,
    0x304c,
    0x304e,
    0x3050,
    0x3052,
    0x3054,
    0x3056,
    0x3058,
    0x305a,
    0x305c,
    0x305e,
    0x3060,
    0x3062,
    0x3065,
    0x3067,
    0x3069,
    0xff85,
    0xff86,
    0xff87,
    0xff88,
    0xff89,
    0x3070,
    0x3073,
    0x3076,
    0x3079,
    0x307c,
];
const cs = [0x3071, 0x3074, 0x3077, 0x307a, 0x307d];

interface DictEntries {
    wordDict: string[];
    wordIndex: string[];
    kanjiData: string[];
    radData: string[];
    nameDict: string[];
    nameIndex: string[];
}

interface Deinflection {
    word?: string;
    type?: number;
    reason?: string;
    debug?: string;
}

interface IndividualWordResult {
    dictionaryForm: string;
    reading: string;
    originalForm: string;
    definitions: string[];
    partOfSpeech: string[];
    conjugation?: string;
}

interface WordSearchResult {
    data?: any[];
    matchLen?: number;
    names?: number;
    more?: number;
}

interface Dictionary {
    config: {
        maxDictEntries: number;
    };
    dictionary: {
        wordDict: string[];
        wordIndex: string[];
        kanjiData: string[];
        radData: string[];
        nameDict: string[];
        nameIndex: string[];
    };
    dif: {
        difReasons: string[];
        difRules: {
            rules?: any[];
            flen?: number;
        }[];
        difExact: string[];
    };
    deinflect: (word: string) => Deinflection[];
    find: (data: string[], text: string) => string | null;
    init: (loadNames: boolean) => Promise<any>;
    loadDictionary: (includeNames: boolean) => Promise<void[]>;
    loadDIF: () => Promise<void[]>;
    loadFileToDictionary: (
        file: string,
        isArray: boolean,
        target: string,
    ) => Promise<void>;
    readFileAsync: (path: string, isArray: boolean) => Promise<string[]>;
    wordSearch: (
        word: string,
        doNames: boolean,
        max: number,
    ) => WordSearchResult;
    parseDictEntry: (entry: string, original: string, inf?: string) => IndividualWordResult;
}

function hasKey<O>(obj: O, key: keyof any): key is keyof O {
    return key in obj;
}

const RikaiDict: Dictionary = {
    config: {
        maxDictEntries: 10,
    },
    dictionary: {
        wordDict: [],
        wordIndex: [],
        kanjiData: [],
        radData: [],
        nameDict: [],
        nameIndex: [],
    },
    dif: {
        difReasons: [],
        difRules: [],
        difExact: [],
    },
    init: (loadNames: boolean) => {
        const started = +new Date();

        const promises = [
            RikaiDict.loadDictionary(loadNames),
            RikaiDict.loadDIF(),
        ];

        return Promise.all(promises).then(() => {
            const ended = +new Date();
            console.log('rcxDict main init done in ' + (ended - started));
        });
    },
    loadDictionary: (includeNames: boolean) => {
        const promises = [
            RikaiDict.loadFileToDictionary('dict.dat', false, 'wordDict'),
            RikaiDict.loadFileToDictionary('dict.idx', false, 'wordIndex'),
            RikaiDict.loadFileToDictionary('kanji.dat', false, 'kanjiData'),
            RikaiDict.loadFileToDictionary('radicals.dat', true, 'radData'),
        ];
        if (includeNames) {
            promises.push(
                RikaiDict.loadFileToDictionary('names.dat', false, 'nameDict'),
            );
            promises.push(
                RikaiDict.loadFileToDictionary('names.idx', false, 'nameIndex'),
            );
        }
        return Promise.all(promises);
    },
    loadDIF: () => {
        const promises = [
            RikaiDict.readFileAsync('./rikaikun/data/deinflect.dat', true).then(
                (buffer: string[]) => {
                    let prevLen = -1;
                    let g: {
                        rules?: any[];
                        flen?: number;
                    };
                    let o: {
                        from?: string;
                        to?: string;
                        type?: string;
                        reason?: string;
                    };

                    // i = 1: skip header
                    for (let i = 1; i < buffer.length; ++i) {
                        const f = buffer[i].split('\t');

                        if (f.length === 1) {
                            RikaiDict.dif.difReasons.push(f[0]);
                        } else if (f.length === 4) {
                            o = {
                                from: f[0],
                                to: f[1],
                                type: f[2],
                                reason: f[3],
                            };

                            if (prevLen !== o.from.length) {
                                prevLen = o.from.length;
                                g = {};
                                g.rules = [];
                                g.flen = prevLen;
                                RikaiDict.dif.difRules.push(g);
                            }
                            g.rules.push(o);
                        }
                    }
                },
            ),
        ];
        return Promise.all(promises);
    },
    loadFileToDictionary: (file: string, isArray: boolean, target: string) => {
        const path = `./rikaikun/data/${file}`;
        return RikaiDict.readFileAsync(path, isArray).then((data) => {
            if (hasKey(RikaiDict.dictionary, target))
                RikaiDict.dictionary[target] = data;
            console.log('async read complete for ' + target);
        });
    },
    readFileAsync: async (path: string, isArray: boolean) => {
        const fileContent = await fs.readFile(path, { encoding: 'utf-8' });

        const array = fileContent.split('\n').filter(function removeBlanks(o) {
            return o && o.length > 0;
        });

        return array;
    },

    deinflect: (word) => {
        const r = [];
        const have: any = [];
        let o: Deinflection;

        o = {
            word,
            type: 0xff,
            reason: '',
        };
        // o.debug = 'root';
        r.push(o);
        have[word] = 0;

        let i;
        let j;
        let k;

        i = 0;
        do {
            word = r[i].word;
            const wordLen = word.length;
            const type = r[i].type;

            for (j = 0; j < RikaiDict.dif.difRules.length; ++j) {
                const g = RikaiDict.dif.difRules[j];
                if (g.flen <= wordLen) {
                    const end = word.substr(-g.flen);
                    for (k = 0; k < g.rules.length; ++k) {
                        const rule = g.rules[k];
                        if (type & rule.type && end === rule.from) {
                            const newWord =
                                word.substr(0, word.length - rule.from.length) +
                                rule.to;
                            if (newWord.length <= 1) continue;
                            o = {};
                            if (have[newWord] !== undefined) {
                                o = r[have[newWord]];
                                o.type |= rule.type >> 8;

                                continue;
                            }
                            have[newWord] = r.length;
                            if (r[i].reason.length)
                                o.reason =
                                    RikaiDict.dif.difReasons[rule.reason] +
                                    ' &lt; ' +
                                    r[i].reason;
                            else
                                o.reason =
                                    RikaiDict.dif.difReasons[rule.reason];
                            o.type = rule.type >> 8;
                            o.word = newWord;
                            r.push(o);
                        }
                    }
                }
            }
        } while (++i < r.length);

        return r;
    },
    parseDictEntry: (dictEntry: string, original:string, inflection?: string) => {
        const dictionaryForm = dictEntry.substring(0, dictEntry.indexOf('[')-1);
        const partOfSpeech = dictEntry.match(/\(.*?\)/)[0].slice(1, -1).split(',');
        const reading = dictEntry.match(/\[.*\]/)[0].slice(1, -1);
        const definitions = dictEntry.match(/\([0-9]*\).+?(?=\([0-9]*\))|\([0-9]*\).+/g);
        return {
            dictionaryForm,
            partOfSpeech,
            reading,
            definitions,
            originalForm: original,
            conjugation: inflection
        }
    },
    wordSearch: (word, doNames, max) => {
        let i;
        let u;
        let v;
        let r;
        let p;
        const trueLen = [0];
        const entry: WordSearchResult = {};

        // half & full-width katakana to hiragana conversion
        // note: katakana vu is never converted to hiragana

        p = 0;
        r = '';
        for (i = 0; i < word.length; ++i) {
            u = v = word.charCodeAt(i);

            // Skip Zero-width non-joiner used in Google Docs between every
            // character.
            if (u === 8204) {
                p = 0;
                continue;
            }

            if (u <= 0x3000) break;

            // full-width katakana to hiragana
            if (u >= 0x30a1 && u <= 0x30f3) {
                u -= 0x60;
            } else if (u >= 0xff66 && u <= 0xff9d) {
                // half-width katakana to hiragana
                u = ch[u - 0xff66];
            } else if (u === 0xff9e) {
                // voiced (used in half-width katakana) to hiragana
                if (p >= 0xff73 && p <= 0xff8e) {
                    r = r.substr(0, r.length - 1);
                    u = cv[p - 0xff73];
                }
            } else if (u === 0xff9f) {
                // semi-voiced (used in half-width katakana) to hiragana
                if (p >= 0xff8a && p <= 0xff8e) {
                    r = r.substr(0, r.length - 1);
                    u = cs[p - 0xff8a];
                }
            } else if (u === 0xff5e) {
                // ignore J~
                p = 0;
                continue;
            }

            r += String.fromCharCode(u);
            // need to keep real length because of the half-width semi/voiced
            // conversion
            trueLen[r.length] = i + 1;
            p = v;
        }
        word = r;

        let dict;
        let index;
        let maxTrim;
        const cache: any = [];
        const have = [];
        let count = 0;
        let maxLen = 0;

        if (doNames) {
            // check: split this
            /*
            this.loadNames();
            dict = RikaiDict.dictionary.nameDict;
            index = RikaiDict.dictionary.nameIndex;
            maxTrim = 20; // this.config.namax;
            entry.names = 1;
            console.log('doNames');*/
        } else {
            dict = RikaiDict.dictionary.wordDict.join('\n');
            index = RikaiDict.dictionary.wordIndex;
            maxTrim = RikaiDict.config.maxDictEntries;
        }

        if (max != null) maxTrim = max;

        entry.data = [];

        while (word.length > 0) {
            const showInf = count !== 0;
            let trys;

            if (doNames) trys = [{ word, type: 0xff, reason: null }];
            else trys = RikaiDict.deinflect(word);

            for (i = 0; i < trys.length; i++) {
                u = trys[i];

                let ix: any = cache[u.word];
                if (!ix) {
                    ix = RikaiDict.find(index, u.word + ',');
                    if (!ix) {
                        cache[u.word] = [];
                        continue;
                    }
                    ix = ix.split(',');
                    cache[u.word] = ix;
                }

                for (let j = 1; j < ix.length; ++j) {
                    const ofs = ix[j];
                    if (have[ofs]) continue;

                    const dentry = dict.substring(ofs, dict.indexOf('\n', ofs));

                    let ok = true;
                    if (i > 0) {
                        // > 0 a de-inflected word

                        // ex:
                        // /(io) (v5r) to finish/to close/
                        // /(v5r) to finish/to close/(P)/
                        // /(aux-v,v1) to begin to/(P)/
                        // /(adj-na,exp,int) thank you/many thanks/
                        // /(adj-i) shrill/

                        let w;
                        const x = dentry.split(/[,()]/);
                        const y = u.type;
                        let z = x.length - 1;
                        if (z > 10) z = 10;
                        for (; z >= 0; --z) {
                            w = x[z];
                            if (y & 1 && w === 'v1') break;
                            if (y & 4 && w === 'adj-i') break;
                            if (y & 2 && w.substr(0, 2) === 'v5') break;
                            if (y & 16 && w.substr(0, 3) === 'vs-') break;
                            if (y & 8 && w === 'vk') break;
                        }
                        ok = z !== -1;
                    }
                    if (ok) {
                        if (count >= maxTrim) {
                            entry.more = 1;
                        }

                        have[ofs] = 1;
                        ++count;
                        if (maxLen === 0) maxLen = trueLen[word.length];

                        if (trys[i].reason) {
                            if (showInf)
                                r = trys[i].reason + ' < ' + word;
                            else r = trys[i].reason;
                        } else {
                            r = null;
                        }

                        entry.data.push(RikaiDict.parseDictEntry(dentry, word, r));
                    }
                } // for j < ix.length
                if (count >= maxTrim) break;
            } // for i < trys.length
            if (count >= maxTrim) break;
            word = word.substr(0, word.length - 1);
        } // while word.length > 0

        if (entry.data.length === 0) return null;

        entry.matchLen = maxLen;
        return entry;
    },
    find(dataArray, text) {
        const data = dataArray.join('\n');
        const tlen = text.length;
        let beg = 0;
        let end = data.length - 1;
        let i;
        let mi;
        let mis;

        while (beg < end) {
            mi = (beg + end) >> 1;
            i = data.lastIndexOf('\n', mi) + 1;

            mis = data.substr(i, tlen);
            if (text < mis) end = i - 1;
            else if (text > mis) beg = data.indexOf('\n', mi + 1) + 1;
            else return data.substring(i, data.indexOf('\n', mi + 1));
        }
        return null;
    },
};

export default RikaiDict;
