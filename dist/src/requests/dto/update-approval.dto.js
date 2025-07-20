"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateApprovalDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_approval_dto_1 = require("./create-approval.dto");
class UpdateApprovalDto extends (0, mapped_types_1.PartialType)(create_approval_dto_1.CreateApprovalDto) {
}
exports.UpdateApprovalDto = UpdateApprovalDto;
//# sourceMappingURL=update-approval.dto.js.map