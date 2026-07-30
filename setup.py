from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = [
		line
		for line in f.read().strip().split("\n")
		if line and not line.startswith("#")
	]

version = "0.0.1"

setup(
	name="library_management",
	version=version,
	description="App for managing Articles, Members, Memberships and Transactions for Libraries",
	author="Frappe",
	author_email="info@frappe.io",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires,
)
