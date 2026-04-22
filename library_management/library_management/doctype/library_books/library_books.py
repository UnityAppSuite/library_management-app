# Copyright (c) 2025, Frappe and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

from edu_quality.public.py.utils import gen_qr_code_b64_transparent


class LibraryBooks(Document):
	def after_insert(self):
		"""Generate QR after insert so payload includes final Book ID."""
		self._store_qr_code()

	def _store_qr_code(self):
		"""Store base64 QR image string in qr_code field."""
		book_id = self.name or ""
		isbn = self.isbn or ""
		book_number = self.get("custom_book_number") or ""
		payload = f"{book_id},{isbn},{book_number}"
		qr_b64 = gen_qr_code_b64_transparent(payload)
		self.db_set("qr_code", qr_b64, update_modified=False)
