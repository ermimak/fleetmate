"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const core_1 = require("@angular/core");
const http_1 = require("@angular/common/http");
const router_1 = require("@angular/router");
const app_routes_1 = require("./app.routes");
exports.appConfig = {
    providers: [
        (0, core_1.provideZoneChangeDetection)({ eventCoalescing: true }),
        (0, router_1.provideRouter)(app_routes_1.routes),
        (0, http_1.provideHttpClient)()
    ]
};
//# sourceMappingURL=app.config.js.map