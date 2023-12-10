/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0]
  if (ns.args.length != 1) {
    ns.tprintf('[!] missing target')
    ns.exit()
  }

  const curSecLvl = ns.getServerSecurityLevel(target)
  const minSecLvl = ns.getServerMinSecurityLevel(target)
  const baseSecLvl = ns.getServerBaseSecurityLevel(target)
  const pctSecLvl = (1-(curSecLvl-minSecLvl)/(baseSecLvl-minSecLvl))*100
  const curMon = ns.getServerMoneyAvailable(target)
  const maxMon = ns.getServerMaxMoney(target)
  const minHackLvl = ns.getServerRequiredHackingLevel(target)
  const curHackLvl = ns.getHackingLevel()
  const hackable = minHackLvl <= curHackLvl

  ns.tprintf("Security Level: %.3f/%.3f (%d %%)", curSecLvl, minSecLvl, pctSecLvl)
  ns.tprintf("Money: %.3f/%.3f (%d %%)", curMon/1e6, maxMon/1e6, curMon/maxMon*100)
  ns.tprintf("Hackable: %s (%d/%d)", hackable, curHackLvl, minHackLvl)
}