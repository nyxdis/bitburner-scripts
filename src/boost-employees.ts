import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    const corp = ns.corporation.getCorporation()

    // eslint-disable-next-line no-constant-condition
    while (true) {
        for (const divisionName of corp.divisions) {
            const division = ns.corporation.getDivision(divisionName)
            for (const city of division.cities) {
                const office = ns.corporation.getOffice(divisionName, city)
                if (office.avgMorale / office.maxMorale < 0.99) {
                    ns.tprintf('Throwing party for division %s in %s (morale %.3f/%.3f)', divisionName, city, office.avgMorale, office.maxMorale)
                    ns.corporation.throwParty(divisionName, city, 4.5e6)
                }
                if (office.avgEnergy / office.maxEnergy < 0.99) {
                    ns.tprintf('Buying tea for division %s in %s (energy %.3f/%.3f)', divisionName, city, office.avgEnergy, office.maxEnergy)
                    ns.corporation.buyTea(divisionName, city)
                }
            }
        }
        await ns.sleep(10000)
    }
}