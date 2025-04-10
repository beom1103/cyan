"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextParam = exports.SystemParam = exports.QueryParam = exports.PathParam = exports.BodyParam = exports.HeaderParam = exports.ParamType = void 0;
const Decorator_1 = require("../core/Decorator");
var ParamType;
(function (ParamType) {
    ParamType["Query"] = "QUERY";
    ParamType["Header"] = "HEADER";
    ParamType["Body"] = "BODY";
    ParamType["Path"] = "PATH";
    ParamType["System"] = "SYSTEM";
    ParamType["Context"] = "CONTEXT";
})(ParamType = exports.ParamType || (exports.ParamType = {}));
function Param(type, name, options) {
    return function ParamInner(target, method, index) {
        Decorator_1.Metadata.getStorage().routeParams.push({
            target: target.constructor,
            method,
            index,
            type,
            name,
            options,
        });
    };
}
function HeaderParam(name, options) {
    return Param(ParamType.Header, name, options || {});
}
exports.HeaderParam = HeaderParam;
function BodyParam(name, options) {
    return Param(ParamType.Body, name, options || {});
}
exports.BodyParam = BodyParam;
function PathParam(name, options) {
    return Param(ParamType.Path, name, options || {});
}
exports.PathParam = PathParam;
function QueryParam(name, options) {
    return Param(ParamType.Query, name, options || {});
}
exports.QueryParam = QueryParam;
function SystemParam(options) {
    return Param(ParamType.System, undefined, options);
}
exports.SystemParam = SystemParam;
function ContextParam(options) {
    return Param(ParamType.Context, undefined, options);
}
exports.ContextParam = ContextParam;
//# sourceMappingURL=Router.param.js.map