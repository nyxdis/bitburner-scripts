// https://docs.google.com/document/d/e/2PACX-1vTzTvYFStkFjQut5674ppS4mAhWggLL5PEQ_IbqSRDDCZ-l-bjv0E6Uo04Z-UfPdaQVu4c84vawwq8E/pub

import { CityName, NS } from '@ns'

const corporationName = 'h4xx0rZ'

const agricultureName = 'h4rvest0rZ'

export async function main(ns: NS): Promise<void> {
    // start corp 
    if (!ns.corporation.hasCorporation()) {
        ns.tprintf("Starting corporation '%s'", corporationName)
        const selfFund = ns.getServerMoneyAvailable('home') > 150e9
        if (!ns.corporation.createCorporation(corporationName, selfFund)) {
            ns.tprintf("ERROR: Failed to create corporation")
            ns.exit()
        }
    }

    // buy first division
    const corp = ns.corporation.getCorporation()
    if (corp.divisions.length === 0) {
        ns.corporation.expandIndustry('Agriculture', agricultureName)
        ns.corporation.purchaseUnlock('Smart Supply')
        ns.corporation.setSmartSupply(agricultureName, 'Sector-12', true)
        for (const [, city] of Object.entries(CityName)) {
            if (city !== CityName.Sector12) {
                ns.corporation.expandCity(agricultureName, city)
            }
            ns.corporation.hireEmployee(agricultureName, city, 'Operations')
            ns.corporation.hireEmployee(agricultureName, city, 'Business')
            ns.corporation.hireEmployee(agricultureName, city, 'Engineer')
            ns.corporation.upgradeWarehouse(agricultureName, city, 2)
            ns.corporation.sellMaterial(agricultureName, city, 'Food', 'MAX', 'MP')
            ns.corporation.sellMaterial(agricultureName, city, 'Plants', 'MAX', 'MP')
        }
        ns.corporation.hireAdVert(agricultureName)

        ns.corporation.levelUpgrade('FocusWires')
        ns.corporation.levelUpgrade('Neural Accelerators')
        ns.corporation.levelUpgrade('Speech Processor Implants')
        ns.corporation.levelUpgrade('Nuoptimal Nootropic Injector Implants')
        ns.corporation.levelUpgrade('Smart Factories')
    }

}
