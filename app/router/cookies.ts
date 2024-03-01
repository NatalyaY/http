import express from "express";

const router = express.Router();

const parseCookies = (req: express.Request) => req.headers.cookie?.split("; ")
    .reduce((acc, cookieStr) => {
        const [name, value] = cookieStr.split("=");
        acc[name] = value;
        return acc;
    }, {} as {[k: string]: string}) || {};

const redirectToBase = (req: express.Request, res: express.Response) => {
    res.status(302);
    res.setHeader("Location", req.baseUrl);
    res.end();
};

router.get("/", (req, res) => {
    const cookies = parseCookies(req);

    res.json(cookies);
    res.end();
});

router.get(
    "/set",
    (req, res, next) => {
        const queries = Object.keys(req.query);

        if (queries.length) {
            queries.forEach(name => res.cookie(name, req.query[name]));
        }

        next();
    },
    redirectToBase,
);

router.get(
    "/delete",
    (req, res, next) => {
        const queries = Object.keys(req.query);

        if (queries.length) {
            const cookies = parseCookies(req);

            queries.forEach(name => {
                if (!cookies[name]) return;
                res.cookie(name, cookies[name], {
                    expires: new Date(0),
                    maxAge: 0,
                });
            });
        }

        next();
    },
    redirectToBase,
);

export default router;
