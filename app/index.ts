import express from "express";

import methodsRouter from "./router/methods";
import statusRouter from "./router/status";
import authRouter from "./router/auth";
import requestRouter from "./router/request";
import responseRouter from "./router/response";
import dynamicRouter from "./router/dynamic";
import cookiesRouter from "./router/cookies";
import redirectRouter from "./router/redirect";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("etag", false);

app.use((req, res, next) => {
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

app.use((req, res, next) => {
    let forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string") {
        forwarded = forwarded.split(", ");
    }
    const clientIp = forwarded?.[0] || req.socket.remoteAddress || "";
    req.headers.clientIp = clientIp;
    next();
});

app.use("/methods", methodsRouter);
app.use("/status", statusRouter);
app.use("/authorization", authRouter);
app.use("/request", requestRouter);
app.use("/response", responseRouter);
app.use("/dynamic-data", dynamicRouter);
app.use("/cookies", cookiesRouter);
app.use("/redirect", redirectRouter);

app.use((req, res) => {
    res.status(404);
    res.end();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(400);
    res.end();
});

app.listen(8080);
