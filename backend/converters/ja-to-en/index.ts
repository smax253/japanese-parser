import greedyParse from './greedy-parse';
import type { Dictionary, WordSearchResult } from '../../rikaikun';
import mapping from './speechmapping';

type Parse = (sentence: string, dict: Dictionary) => WordSearchResult[];

export type { Parse };

function hasKey<O>(obj: O, key: keyof any): key is keyof O {
    return key in obj;
}

const ignored = ['たら'];

const matchParse = async (
    sentence: string,
    parseType: string,
    dict: Dictionary,
    client: any,
) => {
    const parse = greedyParse(sentence, dict);
    const [partOfSpeechResult] = await client.analyzeSyntax({
        document: {
            content: sentence,
            language: 'ja',
            type: 'PLAIN_TEXT',
        },
    });
    const result: any = [];
    let currentIndex = 0;
    console.log(mapping);
    partOfSpeechResult.tokens.forEach((value: any) => {
        if (currentIndex >= parse.length || ignored.includes(value.lemma))
            return;
        let partOfSpeech: string[];
        const googlePOS = value.partOfSpeech.tag.toString();
        if (!hasKey(mapping, googlePOS)) {
            console.warn('key does not exist!');
            return;
        }
        partOfSpeech = (mapping[googlePOS] as unknown) as string[];
        const currentParse = parse[currentIndex];
        console.log('current', currentParse);
        const definition = partOfSpeech
            .map((validPOS) => {
                console.log(validPOS);
                return currentParse.data.find((def: any) => {
                    console.log(def);
                    return def.partOfSpeech.find((defPOS: string) =>
                        defPOS.includes(validPOS),
                    );
                });
            })
            .find((entry) => !!entry);
        console.log('definition', definition);
        currentIndex++;
        result.push({
            ...definition,
        });
    });
    return result;
};

export default matchParse;
