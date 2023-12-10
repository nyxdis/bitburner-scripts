/** @param {NS} ns */
export async function main(ns) {
    const maxLevel = 200
    const maxRam = 64
    const maxCore = 16
    
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
      ns.tprintf('checking node %d', i)
      let node = ns.hacknet.getNodeStats(i)
      let level = node.level
      if (level < maxLevel) {
        const upgrades = maxLevel-level
        ns.tprintf('node %d, upgrade level from %d to %d (%d levels)', i, level, maxLevel, upgrades)
        const moneyAvailable = ns.getServerMoneyAvailable('home')
        const cost = ns.hacknet.getLevelUpgradeCost(i, upgrades)
        if (cost > moneyAvailable) {
          ns.tprintf('Cannot purchase %d level upgrades for node %d, not enough money', upgrades, i)
          ns.exit()
        } else {
          ns.hacknet.upgradeLevel(i, upgrades)
        }
      } else {
        ns.tprintf('node %d, not upgrading level, already %d', i, level)
      }
  
      let ram = node.ram
      if (ram < maxRam) {
        const upgrades = Math.log2(maxRam)-Math.log2(ram)
        ns.tprintf('node %d, upgrade RAM from %d GB to %d GB (%d levels)', i, ram, maxRam, upgrades)
        const moneyAvailable = ns.getServerMoneyAvailable('home')
        const cost = ns.hacknet.getRamUpgradeCost(i, upgrades)
        if (cost > moneyAvailable) {
          ns.tprintf('Cannot purchase %d ram upgrades for node %d, not enough money', upgrades, i)
          ns.exit()
        } else {
          ns.hacknet.upgradeRam(i, upgrades)
        }
      } else {
        ns.tprintf('node %d, not upgrading RAM, already %d GB', i, ram)
      }
  
      let core = node.cores
      if (core < maxCore) {
        const upgrades = maxCore-core
        ns.tprintf('node %d, upgrade core from %d to %d (%d levels)', i, core, maxCore, upgrades)
        const moneyAvailable = ns.getServerMoneyAvailable('home')
        const cost = ns.hacknet.getCoreUpgradeCost(i, upgrades)
        if (cost > moneyAvailable) {
          ns.tprintf('Cannot purchase %d core upgrades for node %d, not enough money', upgrades, i)
          ns.exit()
        } else {
          ns.hacknet.upgradeCore(i, upgrades)
        }
      } else {
        ns.tprintf('node %d, not upgrading core, already %d', i, core)
      }
    }
  }