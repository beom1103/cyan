"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handler = void 0;
const bodyParser = __importStar(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const lodash_1 = require("lodash");
const morgan_1 = __importDefault(require("morgan"));
const Decorator_1 = require("./Decorator");
const Error_1 = require("./Error");
const builtin_1 = require("..//util/builtin");
const Http_error_1 = require("../http/Http.error");
const Http_request_1 = require("../http/Http.request");
const Http_response_1 = require("../http/Http.response");
const Http_status_1 = require("../http/Http.status");
const router_1 = require("../router");
const util_1 = require("../util");
class Handler {
    static beforeHandler(controller) {
        return (req, res, next) => {
            req.httpRequestContext = Http_request_1.HttpRequest.getContext(req);
            req.executionContext = {};
            controller
                .beforeHandle(req.httpRequestContext, req.executionContext)
                .then(() => {
                next();
            })
                .catch((err) => {
                next(err);
            });
        };
    }
    static paramTransformer(value, type) {
        if (String.prototype === type.prototype) {
            value = type(value);
        }
        else if (Number.prototype === type.prototype) {
            value = type(value);
            if (isNaN(value))
                throw new Error("..");
        }
        else if (BigInt.prototype === type.prototype) {
            value = type(value);
        }
        else if (Boolean.prototype === type.prototype) {
            if (typeof value !== "boolean" && typeof value !== "string" && typeof value !== "number") {
                throw new Error("..");
            }
            else if (typeof value === "number") {
                if (value === 1) {
                    value = true;
                }
                else if (value === 0) {
                    value = false;
                }
                else {
                    throw new Error("..");
                }
            }
            else if (typeof value === "string") {
                if (["true", "1"].includes(value.toLowerCase())) {
                    value = true;
                }
                else if (["false", "0"].includes(value.toLowerCase())) {
                    value = false;
                }
                else {
                    throw new Error("..");
                }
            }
        }
        else if (Date.prototype === type.prototype) {
            value = new type(value);
            if (isNaN(value.getTime()))
                throw new Error("..");
        }
        return value;
    }
    static getActionParams(req, route, actionParams) {
        return (route.params || []).map((e, i) => {
            const actionParamFound = actionParams.find(ap => ap.index === i);
            let actionParam = null;
            if (!actionParamFound)
                return undefined;
            if ((0, builtin_1.hasOwnProperty)(actionParamFound.options, "type") && actionParamFound.options.type === "REQ") {
                const { httpRequestContext } = req;
                return httpRequestContext[actionParamFound.options.attr];
            }
            else if ((0, builtin_1.hasOwnProperty)(actionParamFound.options, "type") && actionParamFound.options.type === "CONTEXT") {
                const { attr, validate } = actionParamFound.options;
                const contextAttr = req.executionContext[attr];
                if (validate) {
                    if (validate(contextAttr) === false) {
                        throw Http_response_1.HttpResponder.badRequest.message(`BadRequest (Invalid ${actionParamFound.options.type.toString()}: ${attr})`)();
                    }
                }
                return contextAttr;
            }
            else {
                actionParam = actionParamFound;
            }
            let value = ((type, name) => {
                if (type === router_1.ParamType.Query)
                    return req.query[name];
                if (type === router_1.ParamType.Path)
                    return req.params[name];
                if (type === router_1.ParamType.Header)
                    return req.headers[name];
                if (type === router_1.ParamType.Body)
                    return (0, lodash_1.get)(req.body, name);
            })(actionParam.type, actionParam.name);
            try {
                if (value || typeof value === "boolean" || typeof value === "number") {
                    if (actionParam.options.type === "ENUM") {
                        const em = actionParam.options.enum;
                        const check = (iterVal) => {
                            const emKey = Object.keys(em).find(e => {
                                if ((actionParam === null || actionParam === void 0 ? void 0 : actionParam.type) === router_1.ParamType.Query)
                                    return String(em[e]) === String(iterVal);
                                return em[e] === iterVal;
                            });
                            if (!emKey) {
                                let invalid = actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.invalid;
                                if (typeof invalid === "function") {
                                    invalid = invalid(iterVal);
                                }
                                throw invalid instanceof Http_error_1.HttpError
                                    ? invalid
                                    : Http_response_1.HttpResponder.badRequest.message(invalid || `BadRequest (Invalid ${actionParam === null || actionParam === void 0 ? void 0 : actionParam.type.toString()}: ${actionParam === null || actionParam === void 0 ? void 0 : actionParam.name})`)();
                            }
                        };
                        if (typeof value === "string") {
                            if (actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.delimiter) {
                                value = value.split(actionParam.options.delimiter);
                            }
                        }
                        if ((actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.array) === true) {
                            value = Array.isArray(value) ? value : [value];
                            for (const iterVal of value) {
                                check(iterVal);
                            }
                            if ((actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.required) && !value.length) {
                                value = null;
                            }
                        }
                        else {
                            check(value);
                        }
                    }
                    else if (Array.prototype === e.prototype) {
                        if (typeof value === "string") {
                            if (actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.delimiter) {
                                value = value.split(actionParam.options.delimiter);
                            }
                            else {
                                value = [value];
                            }
                        }
                        if (actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.type) {
                            value = value.map((v) => this.paramTransformer(v, actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.type));
                        }
                    }
                    else {
                        value = this.paramTransformer(value, e);
                    }
                    if (actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.validate) {
                        if (actionParam.options.validate(value) === false) {
                            throw new Error("Validation Failed.");
                        }
                    }
                }
            }
            catch (err) {
                if (err instanceof Http_error_1.HttpError) {
                    throw err;
                }
                else if (typeof (actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.invalid) === "function") {
                    let invalid = actionParam.options.invalid;
                    if (typeof invalid === "function") {
                        invalid = invalid(value);
                    }
                    throw invalid instanceof Http_error_1.HttpError
                        ? invalid
                        : Http_response_1.HttpResponder.badRequest.message(invalid || `BadRequest (Invalid ${actionParam.type.toString()}: ${actionParam.name})`)();
                }
                else {
                    throw Http_response_1.HttpResponder.badRequest.message(actionParam.options.invalid || `BadRequest (Invalid ${actionParam.type.toString()}: ${actionParam.name})`)();
                }
            }
            if ((actionParam === null || actionParam === void 0 ? void 0 : actionParam.options) && "default" in actionParam.options && value === undefined) {
                value = actionParam.options.default;
            }
            if ((actionParam === null || actionParam === void 0 ? void 0 : actionParam.options.required) &&
                (value === null || typeof value === "undefined" || (typeof value === "string" && value === ""))) {
                if (typeof actionParam.options.missing === "function") {
                    throw actionParam.options.missing();
                }
                else {
                    throw Http_response_1.HttpResponder.badRequest.message(actionParam.options.missing || `BadRequest (Missing ${actionParam.type.toString()}: ${actionParam.name})`)();
                }
            }
            return value;
        });
    }
    static actionHandler(controller, route) {
        return async (req, res, next) => {
            let resp;
            let thrown = false;
            const actionParams = (() => {
                if (controller[this.symActionParams] && controller[this.symActionParams][route.method]) {
                    return controller[this.symActionParams][route.method];
                }
                const aps = Decorator_1.Metadata.getStorage().routeParams.filter(rp => rp.target === route.target && rp.method === route.method);
                controller[this.symActionParams] = controller[this.symActionParams] || {};
                controller[this.symActionParams][route.method] = aps;
                return aps;
            })();
            try {
                const params = this.getActionParams(req, route, actionParams);
                resp = await controller[route.method](...params);
            }
            catch (err) {
                thrown = true;
                resp = err;
            }
            if (typeof resp === "function") {
                try {
                    resp = await resp();
                }
                catch (err) {
                    thrown = true;
                    resp = err;
                }
            }
            if (resp instanceof Error || resp instanceof Http_error_1.HttpError || thrown) {
                if (resp instanceof Error || resp instanceof Http_error_1.HttpError) {
                    next(resp);
                }
                else {
                    const name = (0, builtin_1.hasOwnProperty)(resp, "name") ? resp.name : "Unknown";
                    next(new Error_1.ExtendedError((0, builtin_1.hasOwnProperty)(resp, "message") ? resp.message : `An error has occurred. (${name})`, resp));
                }
            }
            else {
                res.preparedResponse = resp;
                next();
            }
        };
    }
    static afterHandler(controller) {
        return (req, res, next) => {
            controller
                .afterHandle(req.httpRequestContext, res.preparedResponse, req.executionContext)
                .then(resp => {
                if (resp instanceof Http_error_1.HttpError) {
                    next(resp);
                }
                else {
                    if (resp instanceof Http_response_1.HttpResponse) {
                        const headers = resp.headers || {};
                        const response = (r => {
                            if (typeof r === "object") {
                                return JSON.stringify(r, (_, v) => (typeof v === "bigint" ? v.toString() : v));
                            }
                            else if (r)
                                return r;
                            else
                                return "No Content";
                        })(resp.content);
                        if (typeof resp.content === "object") {
                            headers["content-type"] = headers["content-type"] || "application/json";
                        }
                        res.processedResponse = {
                            status: resp.status,
                            headers,
                            content: response,
                        };
                        next();
                        return;
                    }
                    res.processedResponse = {
                        status: 200,
                        headers: {},
                        content: resp,
                    };
                    next();
                }
            })
                .catch((err) => {
                next(err);
            });
        };
    }
    static errorHandler(controller, cyan) {
        return ((err, req, res, next) => {
            if (err instanceof Http_response_1.HttpResponse || err instanceof Http_error_1.HttpError) {
                next(err);
                return;
            }
            res.finalized = true;
            controller
                .onError(err, req, cyan)
                .then(errResp => {
                next(errResp);
            })
                .catch((err) => {
                next(err);
            });
        });
    }
    static httpErrorHandler(controller) {
        return ((err, req, res, next) => {
            if (res.finalized) {
                next(err);
                return;
            }
            controller
                .onHttpError(req.httpRequestContext, err)
                .then(resp => {
                next(resp);
            })
                .catch((err) => {
                next(err);
            });
        });
    }
    static accessLogger(name) {
        return (0, morgan_1.default)((tokens, req, res) => [
            `${(0, util_1.datetime)(",")}`,
            `${name},`,
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, "content-length"),
            "-",
            tokens["response-time"](req, res),
            "ms",
        ].join(" "));
    }
    static jsonBodyParser(options) {
        const jsonParser = bodyParser.json(options);
        return (req, res, next) => {
            jsonParser(req, res, err => {
                if (err) {
                    const respErr = new Http_error_1.HttpError(Http_status_1.Status.BadRequest, "The specified json body is invalid.");
                    next(respErr);
                    return;
                }
                next();
            });
        };
    }
    static urlEncodedBodyParser(options) {
        return bodyParser.urlencoded(options || { extended: true });
    }
    static corsHandler(options) {
        return (0, cors_1.default)(options);
    }
}
exports.Handler = Handler;
Handler.symActionParams = Symbol();
//# sourceMappingURL=Handler.js.map