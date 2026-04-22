// Copyright (c) 2025, Frappe and contributors
// For license information, please see license.txt

frappe.ui.form.on("Library Books", {
	refresh(frm) {
		render_qr_preview(frm);
	},
	after_save(frm) {
		// Fetch latest server-stored QR without full form reload.
		frappe.db.get_value("Library Books", frm.doc.name, "qr_code").then((r) => {
			frm.set_value("qr_code", r?.message?.qr_code || "");
			render_qr_preview(frm);
		});
	},
});

function render_qr_preview(frm) {
	const wrapper = frm.get_field("qr_code_preview")?.$wrapper;
	if (!wrapper) return;

	if (!frm.doc.qr_code) {
		wrapper.html('<div class="text-muted small">QR code will appear after save.</div>');
		return;
	}

	wrapper.html(
		`<div style="padding: 6px 0;">
			<img src="${frm.doc.qr_code}" alt="QR Code" style="max-width: 160px; height: auto;" />
		</div>`
	);
}
