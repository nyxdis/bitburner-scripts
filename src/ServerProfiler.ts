import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  if (ns.args.length !== 1 || typeof ns.args[0] !== 'string') {
    ns.tprintf('Must pass a server hostname or IP as an argument for ServerProfiler.js')
    ns.exit()
  }
  const target = ns.args[0]
  const host = ns.getServer()

  if (!ns.serverExists(target)) {
    ns.tprintf('Invalid server IP/hostname')
    ns.exit()
  }
  const server = ns.getServer(target)
  const hackDifficulty = server.hackDifficulty ?? 0
  const minDifficulty = server.minDifficulty ?? 0
  ns.tprintf('Server base security level: %s', ns.formatNumber(server.baseDifficulty ?? 0))
  ns.tprintf('Server current security level: %s', ns.formatNumber(hackDifficulty))
  ns.tprintf('Server minimum security level: %s', ns.formatNumber(minDifficulty))
  let threadsWeaken = 0
  if (hackDifficulty > minDifficulty) {
    threadsWeaken = Math.ceil((hackDifficulty - minDifficulty) / ns.weakenAnalyze(1, host.cpuCores))
    ns.tprintf('Threads required for weaken: %s', ns.formatNumber(threadsWeaken))
  }
  ns.tprintf('Server growth rate: %s', ns.formatNumber(server.serverGrowth ?? 0))
  ns.tprintf('Netscript hack() execution time: %s', ns.tFormat(ns.getHackTime(target)))
  ns.tprintf('Netscript grow() execution time: %s', ns.tFormat(ns.getGrowTime(target)))
  ns.tprintf('Netscript weaken() execution time: %s', ns.tFormat(ns.getWeakenTime(target)))
  ns.tprintf('Server required hacking level: %s', ns.formatNumber(server.requiredHackingSkill ?? 0, 0))
  const moneyAvailable = server.moneyAvailable ?? 0
  const moneyMax = server.moneyMax ?? 0
  const moneyPct = moneyAvailable / moneyMax
  ns.tprintf('Server money available: $%s (%s)', ns.formatNumber(moneyAvailable), ns.formatPercent(moneyPct))
  ns.tprintf('Server money maximum: $%s', ns.formatNumber(server.moneyMax ?? 0))
  let threadsGrow = 0
  let threadsWeakenGrow = 0
  if (moneyMax > moneyAvailable) {
    const growPct = moneyAvailable > 0 ? moneyMax / moneyAvailable : moneyMax
    ns.tprintf('debug: growPct=%s', ns.formatPercent(growPct))
    if (growPct > 1) {
      threadsGrow = Math.ceil(ns.growthAnalyze(target, growPct, host.cpuCores))
      ns.tprintf('Threads required for grow: %s', ns.formatNumber(threadsGrow, 0))
      const growSecInc = ns.growthAnalyzeSecurity(threadsGrow, target, host.cpuCores)
      ns.tprintf('Grow increases security by: %s', ns.formatNumber(growSecInc))
      threadsWeakenGrow = Math.ceil(growSecInc / ns.weakenAnalyze(1, host.cpuCores))
      ns.tprintf('Weaken required to mitigate grow: %s', ns.formatNumber(threadsWeakenGrow, 0))
    }
  }
  const threadsHack = Math.ceil(ns.hackAnalyzeThreads(target, server.moneyAvailable ?? 0))
  ns.tprintf('Threads required for hack: %s', ns.formatNumber(threadsHack, 0))
  const hackSecInc = ns.hackAnalyzeSecurity(threadsHack, target)
  ns.tprintf('Hack increases security by: %s', ns.formatNumber(hackSecInc))
  const threadsWeackenHack = Math.ceil(hackSecInc / ns.weakenAnalyze(1, host.cpuCores))
  ns.tprintf('Weaken required to mitigate hack: %s', ns.formatNumber(threadsWeackenHack, 0))

  ns.tprintf('-------------------------------')
  const totalThreadsWeaken = threadsWeackenHack + threadsWeakenGrow + threadsWeaken
  const ramWeaken = ns.getScriptRam('weaken-single.js') * totalThreadsWeaken
  const ramGrow = ns.getScriptRam('grow-single.js') * threadsGrow
  const ramHack = ns.getScriptRam('hack-single.js') * threadsHack
  ns.tprintf('Total weaken threads: %s (%s RAM)', ns.formatNumber(totalThreadsWeaken, 0), ns.formatRam(ramWeaken))
  ns.tprintf('Total grow threads: %s (%s RAM)', ns.formatNumber(threadsGrow, 0), ns.formatRam(ramGrow))
  ns.tprintf('Total hack threads: %s (%s RAM)', ns.formatNumber(threadsHack, 0), ns.formatRam(ramHack))

  if (ramWeaken + ramGrow < ns.getServerMaxRam('home') - ns.getServerUsedRam('home') && await ns.prompt('Run weaken+grow?')) {
    ns.exec('weaken-single.js', 'home', totalThreadsWeaken, target)
    ns.exec('grow-single.js', 'home', threadsGrow, target)
  }
}
