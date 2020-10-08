import rikaiDict from './rikaikun';

const start = async () => {
    await rikaiDict.init(true);
    // console.log(JSON.stringify(rikaiDict.dif));
    console.log(rikaiDict.wordSearch('行きませんでした', false, 5));
};

start();
