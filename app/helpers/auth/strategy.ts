// eslint-disable-next-line max-classes-per-file
import type express from "express";

import {
    parseAuthHeader,
    requestAuthorization,
    parseDigestCredentials,
    type AuthSchemeName,
} from "./helpers";

import {
    encodeBase64,
    decodeBase64,
    createHashWithAlgo,
} from "../encodings";

type Params<T extends AuthSchemeName> = T extends "Bearer"
    ? { token: string }
    : T extends "Basic"
        ? { user: string; password: string }
        : T extends "Digest"
            ? { user: string; password: string, qop: string, algorithm: string }
            : never

type AuthFields = object | null;

abstract class AuthStrategy<T extends AuthSchemeName, A extends AuthFields = null> {
    scheme: T;
    authFields: A;

    constructor(scheme: T, authFields: Partial<A> | undefined | null = null) {
        this.scheme = scheme;
        this.authFields = authFields as A;
    }

    getAuthFields() {
        return this.authFields;
    }

    checkBaseAuthInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
        const authData = parseAuthHeader(req);

        if (authData?.scheme !== this.scheme) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        if (!authData?.credentials) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        return next();
    }

    abstract checkCredentials(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ): void
}

class BasicAuthStrategy<A extends AuthFields> extends AuthStrategy<"Basic", A> {
    reqParamNames: Params<"Basic">;

    constructor(data: {reqParamNames: Params<"Basic">, authFields: Partial<A>}) {
        super("Basic", data.authFields);
        this.reqParamNames = data.reqParamNames;
    }

    checkCredentials(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) {
        const authData = parseAuthHeader(req);

        if (!authData) {
            res.end();
            return;
        }

        const decodedCredentials = decodeBase64(authData.credentials);
        const user = req.params[this.reqParamNames.user];
        const password = req.params[this.reqParamNames.password];

        if (`${user}:${password}` !== decodedCredentials) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }
        return next();
    }
}

class BearerAuthStrategy extends AuthStrategy<"Bearer"> {
    reqParamNames: Params<"Bearer">;

    constructor({ reqParamNames }: {reqParamNames: Params<"Bearer">}) {
        super("Bearer");
        this.reqParamNames = reqParamNames;
    }

    checkBaseAuthInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
        const authData = parseAuthHeader(req);

        const accessTokens = [
            authData?.credentials,
            req.query.access_token,
            req.body?.access_token,
        ].filter(Boolean);

        const accessToken = accessTokens[0];

        if (accessTokens.length > 1) {
            res.status(400);
            res.end();
            return;
        }

        if (!accessToken || (authData?.scheme && authData?.scheme !== this.scheme)) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        return next();
    }

    checkCredentials(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) {
        const authData = parseAuthHeader(req);

        const accessToken = authData?.credentials ||
        req.query.access_token || req.body?.access_token;

        if (res.headersSent) {
            return;
        }

        const token = req.params[this.reqParamNames.token];

        if (token !== accessToken) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        return next();
    }
}

interface DigitalAuthParams {
    [k: string]: string | boolean,
    algorithm: string,
    nonce: string,
    stale: boolean,
    qop: string
}

class DigitalAuthStrategy<
    A extends DigitalAuthParams
> extends AuthStrategy<"Digest", A> {
    static algorithms = ["MD5", "SHA-256", "SHA-512"];
    static qops = ["auth", "auth-int"];
    static nonceValidityTime = 1000 * 60;

    reqParamNames: Params<"Digest">;

    constructor(data: {reqParamNames: Params<"Digest">, authFields: Partial<A>}) {
        super("Digest", data.authFields);
        this.reqParamNames = data.reqParamNames;
    }

    refreshFields(req: express.Request) {
        const { clientIp } = req.headers;

        const {
            qops, algorithms,
        } = DigitalAuthStrategy;

        const qop = req.params[this.reqParamNames.qop].toLowerCase();
        const algorithm = req.params[this.reqParamNames.algorithm].toUpperCase();

        this.authFields.stale = false;

        this.authFields.qop = qops.includes(qop)
            ? qop
            : qops[0];

        this.authFields.algorithm = algorithms.includes(algorithm)
            ? algorithm
            : algorithms[0];

        this.authFields.nonce = encodeBase64(`${Date.now()}:${clientIp}`);
    }

    checkBaseAuthInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.refreshFields(req);
        return super.checkBaseAuthInfo(req, res, next);
    }

    checkCredentials(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) {
        const authData = parseAuthHeader(req);

        if (!authData) {
            res.end();
            return;
        }

        const authParams = parseDigestCredentials(authData.credentials);

        const user = req.params[this.reqParamNames.user];

        if (
            authParams.username !== user ||
            authParams.uri !== req.originalUrl ||
            authParams.realm !== this.authFields.realm ||
            authParams.algorithm !== this.authFields.algorithm
        ) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        const [time] = decodeBase64(authParams.nonce)
            .split(":");

        if (
            !time ||
            Number.isNaN(+time) ||
            Date.now() - Number(time) > DigitalAuthStrategy.nonceValidityTime
        ) {
            this.refreshFields(req);
            this.authFields.stale = true;
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        const response = this.getHashedResponse(req, authParams);

        if (response !== authParams.response) {
            return requestAuthorization(res, this.scheme, this.getAuthFields());
        }

        return next();
    }

    getHashedResponse(
        req: express.Request,
        authParams: ReturnType<typeof parseDigestCredentials>,
    ) {
        const A2Params = authParams.qop === "auth-int"
            ? [
                req.method,
                authParams.uri,
                createHashWithAlgo(
                    req.body,
                    this.authFields.algorithm,
                ),
            ]
            : [req.method, authParams.uri];

        const user = req.params[this.reqParamNames.user];
        const password = req.params[this.reqParamNames.password];

        const A1 = createHashWithAlgo(
            [user, authParams.realm, password].join(":"),
            this.authFields.algorithm,
        );

        const A2 = createHashWithAlgo(
            A2Params.join(":"),
            this.authFields.algorithm,
        );

        const responseParams = authParams.qop
            ? [A1, authParams.nonce, authParams.nc, authParams.cnonce, authParams.qop, A2]
            : [A1, authParams.nonce, A2];

        return createHashWithAlgo(
            responseParams.join(":"),
            this.authFields.algorithm,
        );
    }
}

export {
    BasicAuthStrategy, BearerAuthStrategy, DigitalAuthStrategy,
};
