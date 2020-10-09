import wordsRoute from './words';

const constructor = (app: any) => {
    app.use('/words', wordsRoute);
    app.use('*', (_: any, res: any) => {
        res.status(404).json({ error: 'Resource not found!' });
    });
};

export default constructor;
