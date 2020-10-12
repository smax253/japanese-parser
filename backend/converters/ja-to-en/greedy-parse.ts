import type { Dictionary, WordSearchResult } from '../../rikaikun';
import type { Parse } from './index';
const greedyParse: Parse = (sentence: string, dict: Dictionary) => {
    // parse greedily from the beginning of the sentence.
    let parsedLength = 0;
    const result = [];
    while (parsedLength < sentence.length) {
        let query;
        let length = sentence.length - parsedLength;
        do {
            query = dict.wordSearch(
                sentence.substring(parsedLength, parsedLength + length),
                false,
                3,
            );

            length--;
        } while (!query && length > 0);
        console.log(length);
        if (length === 0) {
            parsedLength++;
        } else {
            result.push(query);
            parsedLength += query.matchLen;
        }
    }
    return result;
};

export default greedyParse;
