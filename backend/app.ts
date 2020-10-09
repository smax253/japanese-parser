import rikaiDict from './rikaikun';

const start = async () => {
    await rikaiDict.init(true);
    // console.log(JSON.stringify(rikaiDict.dif));
    console.log(JSON.stringify(rikaiDict.wordSearch('走ります', false, 5)));
};

start();
