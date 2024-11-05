/** @odoo-module */

import { ListController } from "@web/views/list/list_controller";
import { useService } from '@web/core/utils/hooks';
import { listView } from "@web/views/list/list_view";
import { registry } from "@web/core/registry";
import { sprintf } from '@web/core/utils/strings';

import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";

export class PurchaseApproveAllListController extends ListController {
    setup() {
       super.setup();
       this.orm = useService('orm');
       this.notification = useService("notification");
    }

    async onClickApproveAll() {
        const recordIds = this.model.root.records.map((rec) => rec.resId);
        if (recordIds.length) {
            const confirm = await new Promise((resolve) => {
                this.dialogService.add(ConfirmationDialog, {
                    body: this.env._t("Would you like to approve all these purchases ?"),
                    confirm: async () => {
                        await this.orm.call('purchase.order', 'button_approve', [recordIds]);
                        this.notification.add(
                            sprintf(this.env._t("%s purchase(s) approved."), recordIds.length),
                            {
                                title: this.env._t("Success"),
                                type: "success",
                            },
                        );
                        await this.model.load();
                    },
                    cancel: () => {},
                });
            });
        } else {
            this.notification.add(this.env._t("There are no purchase to approve."), {
                type: "warning"
            });
        }
    }
}

registry.category("views").add("purchase_approve_all_list_view", {
    ...listView,
    Controller: PurchaseApproveAllListController,
    buttonTemplate: "PurchaseApproveAll.Buttons",
});