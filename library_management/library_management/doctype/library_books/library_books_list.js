frappe.listview_settings["Library Books"] = {
	onload(listview) {
		listview.page.add_action_item(__("Print QR Code"), async () => {
			const selected_docnames = listview.get_checked_items(true) || [];

			if (!selected_docnames.length) {
				frappe.msgprint(__("Please select at least one book."));
				return;
			}

			const print_window = window.open("", "_blank");
			if (!print_window) {
				frappe.msgprint(__("Pop-up blocked. Please allow pop-ups and try again."));
				return;
			}

			print_window.document.open();
			print_window.document.write(build_loading_html());
			print_window.document.close();

			try {
				const response = await frappe.call({
					method: "frappe.client.get_list",
					args: {
						doctype: "Library Books",
						fields: [
							"name",
							"book_name",
							"isbn",
							"author",
							"accession_number",
							"qr_code",
						],
						filters: [["name", "in", selected_docnames]],
						limit_page_length: selected_docnames.length,
					},
				});

				const books = (response.message || []).sort(
					(a, b) => selected_docnames.indexOf(a.name) - selected_docnames.indexOf(b.name)
				);

				if (!books.length) {
					print_window.close();
					frappe.msgprint(__("No book data found for selected documents."));
					return;
				}

				const printable_html = build_printable_html(books);
				print_window.document.open();
				print_window.document.write(printable_html);
				print_window.document.close();
			} catch (error) {
				print_window.close();
				frappe.msgprint({
					title: __("Print Failed"),
					message: __("Unable to prepare print pages. Please try again."),
					indicator: "red",
				});
				console.error("Library book QR print error:", error);
			}
		});
	},
};

function escape_html(value) {
	const raw = value == null ? "" : String(value);
	if (frappe?.utils?.escape_html) {
		return frappe.utils.escape_html(raw);
	}
	return raw.replace(/[&<>"']/g, (char) => {
		const entity_map = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return entity_map[char] || char;
	});
}

function info_row(label, value) {
	return `
		<div class="info-row">
			<span class="label">${escape_html(label)}</span>
			<span class="value">${escape_html(value) || "-"}</span>
		</div>
	`;
}

function build_page(book) {
	const qr_html = book.qr_code
		? `<img src="${book.qr_code}" alt="${escape_html(book.name)} QR Code" class="qr-image" />`
		: `<div class="qr-missing">${__("QR not available")}</div>`;

	return `
		<section class="print-page">
			<div class="qr-panel">
				${qr_html}
			</div>
			<div class="details-panel">
				<h2>${escape_html(book.book_name || book.name)}</h2>
				${info_row(__("Book ID"), book.name)}
				${info_row(__("ISBN"), book.isbn)}
				${info_row(__("Author"), book.author)}
				${info_row(__("Accession Number"), book.accession_number)}
			</div>
		</section>
	`;
}

function build_printable_html(books) {
	const sheets = [];
	for (let i = 0; i < books.length; i += 3) {
		const chunk = books.slice(i, i + 3);
		sheets.push(`<section class="sheet">${chunk.map((book) => build_page(book)).join("")}</section>`);
	}

	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<title>${__("Library Book QR Print")}</title>
				<style>
					* {
						box-sizing: border-box;
					}

					html,
					body {
						margin: 0;
						padding: 0;
						font-family: Arial, sans-serif;
						background: #fff;
						color: #111;
					}

					.sheet {
						width: 210mm;
						height: 297mm;
						display: grid;
						grid-template-rows: repeat(3, 1fr);
						gap: 6mm;
						padding: 8mm;
						page-break-after: always;
						break-after: page;
						overflow: hidden;
					}

					.sheet:last-child {
						page-break-after: auto;
						break-after: auto;
					}

					.print-page {
						display: grid;
						grid-template-columns: 38% 62%;
						gap: 10px;
						align-items: center;
						padding: 8px;
						border: 1px solid #ececec;
						min-height: 0;
					}

					.qr-panel {
						border: 1px solid #d9d9d9;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 8px;
						height: 100%;
					}

					.qr-image {
						width: 100%;
						max-width: 180px;
						height: auto;
					}

					.qr-missing {
						font-size: 14px;
						color: #777;
						text-align: center;
					}

					.details-panel h2 {
						margin: 0 0 8px;
						font-size: 16px;
						line-height: 1.3;
					}

					.info-row {
						display: grid;
						grid-template-columns: 125px 1fr;
						gap: 6px;
						padding: 3px 0;
						border-bottom: 1px solid #ececec;
						font-size: 12px;
					}

					.label {
						font-weight: 600;
					}

					.value {
						overflow-wrap: anywhere;
					}

					@media print {
						html,
						body {
							width: 210mm;
							height: 297mm;
							overflow: hidden;
						}

						@page {
							size: A4 portrait;
							margin: 0;
						}
					}
				</style>
			</head>
			<body>
				${sheets.join("")}
				<script>
					window.addEventListener("load", () => {
						setTimeout(() => window.print(), 150);
					});
				</script>
			</body>
		</html>
	`;
}

function build_loading_html() {
	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<title>${__("Preparing Print")}</title>
				<style>
					body {
						margin: 0;
						min-height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
						font-family: Arial, sans-serif;
						color: #333;
					}
				</style>
			</head>
			<body>${__("Preparing print layout...")}</body>
		</html>
	`;
}
