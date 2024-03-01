import express from "express";

const router = express.Router();

const redirect = (res: express.Response, location: string) => {
    res.status(302);
    res.setHeader("Location", location);
    res.end();
};

const handleRedirect = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    times: string,
    absolute?: boolean,
) => {
    const redirectTimes = Number.parseInt(times, 10);

    if (!redirectTimes || Number.isNaN(redirectTimes)) {
        res.status(400);
        res.end();
    }

    const baseUrl = absolute ? `${req.protocol}://${req.get("host")}` : "";

    if (redirectTimes === 1) {
        redirect(res, `${baseUrl}/request/headers`);
        return;
    }

    redirect(res, baseUrl + req.originalUrl.replace(`${redirectTimes}`, `${redirectTimes - 1}`));
};

router.get("/relative/:n", (req, res, next) => handleRedirect(req, res, next, req.params.n));

router.get("/absolute/:n", (req, res, next) => handleRedirect(req, res, next, req.params.n, true));

export default router;
