/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0]
    const server = ns.getServer(target)
    const host = ns.getServer()
  
    // threads for grow
    const growBy = server.moneyMax/server.moneyAvailable
    const threadsGrow = Math.ceil(ns.growthAnalyze(target, growBy, host.cpuCores))
    const growSecInc = ns.growthAnalyzeSecurity(threadsGrow, target, host.cpuCores)
  
    // threads for weaken
    const weakenBy = server.hackDifficulty + growSecInc - server.minDifficulty
    const threadsWeaken = Math.ceil(weakenBy / ns.weakenAnalyze(1, host.cpuCores))
  
    if (threadsGrow > 0) {
      const delay = Math.max(ns.getWeakenTime(target) - ns.getGrowTime(target), 0)
      ns.exec('single-v2/grow.js', host.hostname, threadsGrow, delay, target)
    }
    if (threadsWeaken > 0) {
      const delay = Math.max(ns.getGrowTime(target) - ns.getWeakenTime(target), 0)
      ns.exec('single-v2/weaken.js', host.hostname, threadsWeaken, delay, target)
    }
  }