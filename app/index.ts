import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set({
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATH",
        "Access-Control-Request-Headers": "*",
        "Access-Control-Allow-Credentials": !!req.headers.origin,
        Vary: "Origin",
    });
    next();
});

app.use((req: express.Request, res: express.Response) => {
    res.status(404);
    res.end();
});

app.listen(8080);
