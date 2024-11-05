from odoo import fields, models, _
from odoo.exceptions import ValidationError


class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    user_id = fields.Many2one(default=False, copy=False)


    def button_confirm(self):
        """
            Override the default function
        """
        for order in self:
            if order.state not in ['draft', 'sent']:
                continue
            order.order_line._validate_analytic_distribution()
            order._add_supplier_to_product()
            # Deal with double validation process
            if order._approval_allowed():
                order.button_approve()
                # Make the current user as the buyer if no one is set
                if not order.user_id:
                    order.write({'user_id': self.env.user})
            else:
                # Raise error if user need approbation AND the buyer field is not set
                if not order.user_id:
                    raise ValidationError(_(
                        "You must assign a buyer for %s before asking approval.",
                        order.name,
                    ))
                order.write({'state': 'to approve'})
            if order.partner_id not in order.message_partner_ids:
                order.message_subscribe([order.partner_id.id])
        return True

    def _approval_allowed(self):
        self.ensure_one()
        return super(PurchaseOrder, self)._approval_allowed() or self.partner_id.no_need_approval