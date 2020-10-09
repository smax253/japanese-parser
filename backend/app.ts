import rikaiDict from './rikaikun';
import express from 'express';
import routesInit from './routes';
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

start();
