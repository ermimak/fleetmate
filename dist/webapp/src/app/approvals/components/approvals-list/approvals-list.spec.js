"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const approvals_list_1 = require("./approvals-list");
describe('ApprovalsList', () => {
    let component;
    let fixture;
    beforeEach(async () => {
        await testing_1.TestBed.configureTestingModule({
            imports: [approvals_list_1.ApprovalsList]
        })
            .compileComponents();
        fixture = testing_1.TestBed.createComponent(approvals_list_1.ApprovalsList);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=approvals-list.spec.js.map