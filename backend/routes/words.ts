import express from 'express';
import RikaiDict from '../rikaikun';
const router = express.Router();

router.get('/', async (req, res) => {
    console.log(req.body);
    const query = req.body?.query;
    if (!query) {
        res.status(400).json({
            error: 'no query provided!',
        });
        return;
    }
    const numberOfResults = +req.body.limit ? +req.body.limit : 5;
    if (!numberOfResults || numberOfResults < 1) {
        res.status(400).json({
            error:
                'invalid limit parameter, must be a positive integer number.',
        });
        return;
    }
    const result = RikaiDict.wordSearch(query, false, numberOfResults);
    if (!result)
        res.status(400).json({ error: 'word does not exist in dictionary!' });
    else res.json(result);
});

export default router;
