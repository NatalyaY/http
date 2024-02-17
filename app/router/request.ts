import express from "express";

const router = express.Router();

router.get("/ip", (req, res) => {
    res.status(200);
    res.send({ ip: req.headers.clientIp });
});

router.get("/user-agent", (req, res) => {
    res.status(200);
    res.send({ "user-agent": req.headers["user-agent"] });
});

router.get("/headers", (req, res) => {
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        clientIp, ...headers
    } = req.headers;

    res.status(200);
    res.send({ headers });
});

export default router;
