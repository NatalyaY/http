import express from "express";
import bodyParser from "body-parser";

import methodsRouter from "./router/methods";

const app = express();
app.use(bodyParser.json());

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set({
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": !!req.headers.origin,
        Vary: "Origin",
    });

    if (req.method === "OPTIONS") {
        const defaultMethods = "POST, GET, OPTIONS, PUT, DELETE, PATCH";

        res.set({
            "Access-Control-Allow-Methods": req.headers["access-control-request-method"] ||
            defaultMethods,
            "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "*",
            "Access-Control-Max-Age": 3600,
        });
        res.status(200);
        res.end();
    }
    next();
});

app.use("/methods", methodsRouter);

app.use((req: express.Request, res: express.Response) => {
    res.status(404);
    res.end();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(400);
    res.end();
});

app.listen(8080);
