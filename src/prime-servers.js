/** @param {NS} ns */
export async function main(ns) {
    for (const s of ns.scan()) {
      await prime(ns, s, 'home')
    }
  }
  
  /** @param {NS} ns */
  async function prime(ns, target, source) {
    const host = ns.getServer()
    const server = ns.getServer(target)
  
    // threads for grow
    let growBy = 0
    if (server.moneyAvailable == 0) {
      growBy = server.moneyMax
    } else {
      growBy = server.moneyMax/server.moneyAvailable
    }
    let threadsGrow = 0
    let growSecInc = 0
    if (growBy > 1) {
      ns.tprintf('target: %s, growBy: %f, moneyMax: %.3fm, moneyAvailable: %.3fm', target, growBy, server.moneyMax/1e6, server.moneyAvailable/1e6)
      threadsGrow = Math.ceil(ns.growthAnalyze(target, growBy, host.cpuCores))
      growSecInc = ns.growthAnalyzeSecurity(threadsGrow, target, host.cpuCores)
    }
  
    // threads for weaken
    const weakenBy = server.hackDifficulty + growSecInc - server.minDifficulty
    const threadsWeaken = Math.ceil(weakenBy / ns.weakenAnalyze(1, host.cpuCores))
  
    const ramRequired = Math.ceil(ns.getScriptRam('grow-single.js')*threadsGrow + ns.getScriptRam('weaken-single.js')*threadsWeaken)
  
    let ramFree = Math.floor(ns.getServerMaxRam(host.hostname) - ns.getServerUsedRam(host.hostname))
    while (ramRequired > ramFree) {
      ns.tprintf("Not enough RAM free to prime '%s' (need %d GB, have %d GB), waiting", target, ramRequired, ramFree)
      await ns.sleep(10000)
      ramFree = Math.floor(ns.getServerMaxRam(host.hostname) - ns.getServerUsedRam(host.hostname))
    }
  
    if (server.requiredHackingSkill > ns.getHackingLevel()) {
      ns.tprint('Hacking skill too low for ', target, ', skipping')
    } else {
      if (threadsGrow > 0) {
        const delay = Math.max(ns.getWeakenTime(target) - ns.getGrowTime(target) - 500, 0)
        ns.exec('single-v2/grow.js', host.hostname, threadsGrow, delay, target)
      }
      if (threadsWeaken > 0) {
        ns.exec('single-v2/weaken.js', host.hostname, threadsWeaken, 0, target)
      }
    }
  
    for (const s of ns.scan(target)) {
      if (s != source)
        await prime(ns, s, target)
    }
  }