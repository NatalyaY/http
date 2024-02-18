import express from "express";

import {
    gzip,
    deflate,
    brotliCompress,
} from "node:zlib";

const router = express.Router();

router.get("/headers", (req, res) => {
    res.status(200);
    Object.keys(req.query)
        .forEach(key => {
            res.set({ [key]: req.query[key] });
        });
    res.send(res.getHeaders());
});

router.get(
    "/cache/:etag/:date/:cacheAge",
    (req, res, next) => {
        const {
            etag,
            date,
        } = req.params;

        const nonMatch = req.headers["if-none-match"]?.split(", ");
        const match = req.headers["if-match"]?.split(", ");
        const modified = req.headers["if-modified-since"];

        if (nonMatch && (nonMatch.includes("*") || nonMatch.includes(etag))) {
            res.status(304);
            return next();
        }

        if (match && (!match.includes("*") || !match.includes(etag))) {
            res.status(412);
            return next();
        }

        if (modified) {
            try {
                const paramDate = new Date(date);
                const headerDate = new Date(modified);
                if (paramDate < headerDate) {
                    res.status(304);
                    return next();
                }
            } catch (error) {
                res.status(400);
                return next();
            }
        }

        res.status(200);
        res.send("Fresh!");
    },
    (req, res) => {
        if (res.statusCode === 304) {
            res.set({
                "Cache-Control": `public, max-age=$${req.params.cacheAge}`,
                Date: req.params.date,
                Etag: req.params.etag,
            });
        }
        res.end();
    },
);

const sendEncoded = (
    req: express.Request,
    res: express.Response,
    type: "gzip" | "deflate" | "brotli",
) => {
    const body = JSON.stringify({ encodeing: type });

    const compressors = {
        gzip,
        deflate,
        brotli: brotliCompress,
    };

    const compressor = compressors[type];

    compressor(body, (err, response) => {
        if (err) {
            res.status(500);
            res.end();
            return;
        }

        res.status(200);
        res.set({
            "Content-Encoding": type === "brotli" ? "br" : type,
            "Content-Type": "application/json",
        });
        res.send(response);
    });
};

router.get("/gzip", (req, res) => sendEncoded(req, res, "gzip"));
router.get("/deflate", (req, res) => sendEncoded(req, res, "deflate"));
router.get("/brotli", (req, res) => sendEncoded(req, res, "brotli"));

export default router;
