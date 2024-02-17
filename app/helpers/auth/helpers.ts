import type express from "express";

export type AuthSchemeName = "Basic" | "Bearer" | "Digest";

const joinObjToString = (obj: object) => Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

const parseAuthHeader = (req: express.Request) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return null;

    const authScheme = authHeader.split(" ")[0];
    const authCredentials = authHeader
        .replace(authScheme, "")
        .trim();

    return {
        scheme: authScheme,
        credentials: authCredentials,
    };
};

const parseDigestCredentials = (credentials: string) => {
    const parts = credentials.split(", ");

    return parts.reduce((acc, part) => {
        const [name, value] = part.split("=");
        acc[name] = value.replaceAll("\"", "");
        return acc;
    }, {} as {[k: string]: string});
};

const requestAuthorization = (
    res: express.Response,
    scheme: AuthSchemeName,
    extraFields?: object|null,
) => {
    const extraParamsText = extraFields
        ? ` ${joinObjToString(extraFields)}`
        : "";

    res.status(401);
    res.set({ "WWW-Authenticate": scheme + extraParamsText });
    res.end();
};

export {
    requestAuthorization, parseDigestCredentials, parseAuthHeader,
};
