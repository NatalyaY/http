import express from "express";

import {
    BasicAuthStrategy,
    BearerAuthStrategy,
    DigitalAuthStrategy,
} from "../helpers/auth/strategy";

const router = express.Router();

const basicAuth = new BasicAuthStrategy(
    {
        authFields: { realm: "Basic access" },
        reqParamNames: {
            user: "user",
            password: "password",
        },
    },
);

const bearerAuth = new BearerAuthStrategy({ reqParamNames: { token: "token" } });

const digestAuth = new DigitalAuthStrategy(
    {
        authFields: { realm: "Digest access" },
        reqParamNames: {
            user: "user",
            password: "pass",
            qop: "qop",
            algorithm: "algo",
        },
    },
);

router.get(
    "/basic/:user/:password",
    basicAuth.checkBaseAuthInfo.bind(basicAuth),
    basicAuth.checkCredentials.bind(basicAuth),
    (req, res) => {
        res.status(200);
        res.send("Authorized by Base Auth!");
    },
);

router.get(
    "/hidden-basic/:user/:password",
    basicAuth.hiddenCheck.bind(basicAuth),
    (req, res) => {
        res.status(200);
        res.send("Authorized by Base Auth!");
    },
);

router.get(
    "/bearer/:token",
    bearerAuth.checkBaseAuthInfo.bind(bearerAuth),
    bearerAuth.checkCredentials.bind(bearerAuth),
    (req, res) => {
        res.status(200);
        if (req.query.access_token) {
            res.set({ "Cache-Control": "private" });
        }
        res.send({
            access_token: req.params.token,
            token_type: "Bearer",
        });
    },
);

router.get(
    "/digest/:qop/:user/:pass/:algo?",
    digestAuth.checkBaseAuthInfo.bind(digestAuth),
    digestAuth.checkCredentials.bind(digestAuth),
    (req, res) => {
        res.status(200);
        res.send("Authorized by Digest Auth!");
    },
);

export default router;
