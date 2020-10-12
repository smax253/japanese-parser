import rikaiDict from './rikaikun';
import express from 'express';
import routesInit from './routes';
import compromise from 'compromise';
const app = express();

const start = async () => {
    await rikaiDict.init(true);
    // console.log(JSON.stringify(rikaiDict.dif));
    // console.log(rikaiDict.wordSearch('hello', false, 5));
    app.use(express.json());

    routesInit(app);
    app.listen(3000, () => {
        console.log('server running!');
    });
};

// start();

const result = compromise("Max's car is red.");
console.log(JSON.stringify(result.json()));
