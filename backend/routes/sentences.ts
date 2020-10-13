import express from 'express';
import matchParse from '../converters/ja-to-en'
import RikaiDict from '../rikaikun'
import language from '@google-cloud/language';

const router = express.Router();
const client = new language.LanguageServiceClient();


router.get('/', async (req, res) => {
    const query = req.body?.query;
    if(!query){
        res.status(400).json({
            error: 'no query provided!',
        })
        return;
    }
    const result = await matchParse(req.body.query, 'test', RikaiDict, client);
    console.log('result', result)
    res.json(result);
    return;
})

export default router;