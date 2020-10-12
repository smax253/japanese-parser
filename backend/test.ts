import language from '@google-cloud/language';
import rcxdict from './rikaikun';

async function quickstart() {
    // Imports the Google Cloud client library

    // Instantiates a client
    const client = new language.LanguageServiceClient();

    // The text to analyze
    const jatext = '私は飴が持ったら、嬉しいです';
    const entext = 'I would be happy if I had a candy';

    // Detects the sentiment of the text
    const [enresult] = await client.analyzeSyntax({
        document: {
            content: entext,
            type: 'PLAIN_TEXT',
        },
    });
    const [jaresult] = await client.analyzeSyntax({
        document: {
            content: jatext,
            type: 'PLAIN_TEXT',
            language: 'ja',
        },
    });

    console.log(`Text: ${entext}`);
    console.log(`Result: ${JSON.stringify(enresult)}`);

    console.log(`Text: ${jatext}`);
    console.log(`Result: ${JSON.stringify(jaresult)}`);
}

import matchParse from './converters/ja-to-en';

const test = async () => {
    await rcxdict.init(false);
    const client = new language.LanguageServiceClient();
    console.log(
        JSON.stringify(
            await matchParse(
                '私は飴が持ったら、嬉しいです',
                'test',
                rcxdict,
                client,
            ),
        ),
    );
};

// quickstart();
test();
