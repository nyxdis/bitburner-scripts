import { CityName, Division, NS } from '@ns'

export async function main(ns: NS): Promise<void> {
	await trickInvest(ns, ns.corporation.getDivision(''))
}

async function trickInvest(ns: NS, division: Division, productCity: CityName = CityName.Sector12) {
	ns.print("Prepare to trick investors")
	for (const product of division.products) {
		// stop selling products
		ns.corporation.sellProduct(division.name, productCity, product, "0", "MP", true)
	}

	for (const [, city] of Object.entries(CityName)) {
		// put all employees into production to produce as fast as possible 
		const employees = ns.corporation.getOffice(division.name, city).numEmployees

		await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", 0)
		await ns.corporation.setAutoJobAssignment(division.name, city, "Management", 0)
		await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", 0)
		await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", employees - 2); // workaround for bug
		await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", employees - 1); // workaround for bug
		await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", employees)
	}

	ns.print("Wait for warehouses to fill up")
	//ns.print("Warehouse usage: " + refWarehouse.sizeUsed + " of " + refWarehouse.size)
	let allWarehousesFull = false
	while (!allWarehousesFull) {
		allWarehousesFull = true
		for (const [, city] of Object.entries(CityName)) {
			if (ns.corporation.getWarehouse(division.name, city).sizeUsed <= (0.98 * ns.corporation.getWarehouse(division.name, city).size)) {
				allWarehousesFull = false
				break
			}
		}
		await ns.sleep(5000)
	}
	ns.print("Warehouses are full, start selling")

	const initialInvestFunds = ns.corporation.getInvestmentOffer().funds
	ns.print("Initial investmant offer: " + ns.nFormat(initialInvestFunds, "0.0a"))
	for (const [, city] of Object.entries(CityName)) {
		// put all employees into business to sell as much as possible 
		const employees = ns.corporation.getOffice(division.name, city).numEmployees
		await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 0)
		await ns.corporation.setAutoJobAssignment(division.name, city, "Business", employees - 2); // workaround for bug
		await ns.corporation.setAutoJobAssignment(division.name, city, "Business", employees - 1); // workaround for bug
		await ns.corporation.setAutoJobAssignment(division.name, city, "Business", employees)
	}
	for (const product of division.products) {
		// sell products again
		ns.corporation.sellProduct(division.name, productCity, product, "MAX", "MP", true)
	}

	while (ns.corporation.getInvestmentOffer().funds < (4 * initialInvestFunds)) {
		// wait until the stored products are sold, which should lead to huge investment offers
		await ns.sleep(200)
	}

	ns.print("Investment offer for 10% shares: " + ns.nFormat(ns.corporation.getInvestmentOffer().funds, "0.0a"))
	ns.print("Funds before public: " + ns.nFormat(ns.corporation.getCorporation().funds, "0.0a"))

	ns.corporation.goPublic(800e6)

	ns.print("Funds after  public: " + ns.nFormat(ns.corporation.getCorporation().funds, "0.0a"))

	for (const [, city] of Object.entries(CityName)) {
		// set employees back to normal operation
		const employees = ns.corporation.getOffice(division.name, city).numEmployees
		await ns.corporation.setAutoJobAssignment(division.name, city, "Business", 0)
		if (city == productCity) {
			await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 1)
			await ns.corporation.setAutoJobAssignment(division.name, city, "Engineer", (employees - 2))
			await ns.corporation.setAutoJobAssignment(division.name, city, "Management", 1)
		}
		else {
			await ns.corporation.setAutoJobAssignment(division.name, city, "Operations", 1)
			await ns.corporation.setAutoJobAssignment(division.name, city, "Research & Development", (employees - 1))
		}
	}
}