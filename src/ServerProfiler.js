/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length != 1) {
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
    ns.tprintf('Server base security level: %d', server.baseDifficulty)
    ns.tprintf('Server current security level: %f', server.hackDifficulty)
    ns.tprintf('Server minimum security level: %d', server.minDifficulty)
    let threadsWeaken = 0
    if (server.hackDifficulty > server.minDifficulty) {
      threadsWeaken = Math.ceil((server.hackDifficulty - server.minDifficulty) / ns.weakenAnalyze(1, host.cpuCores))
      ns.tprintf('Threads required for weaken: %d', threadsWeaken)
    }
    ns.tprintf('Server growth rate: %f', server.serverGrowth)
    ns.tprintf('Netscript hack() execution time: %s', msToText(ns.getHackTime(target)))
    ns.tprintf('Netscript grow() execution time: %s', msToText(ns.getGrowTime(target)))
    ns.tprintf('Netscript weaken() execution time: %s', msToText(ns.getWeakenTime(target)))
    ns.tprintf('Server required hacking level: %d', server.requiredHackingSkill)
    const moneyPct = server.moneyAvailable/server.moneyMax
    ns.tprintf('Server money available: %.3fm (%d %%)', server.moneyAvailable/1e6, moneyPct*100)
    ns.tprintf('Server money maximum: %.3fm', server.moneyMax/1e6)
    let threadsGrow = 0
    let threadsWeakenGrow = 0
    if (server.moneyMax > server.moneyAvailable) {
      const growPct = server.moneyAvailable > 0 ? server.moneyMax/server.moneyAvailable : server.moneyMax
      ns.tprintf('debug: growPct=%f', growPct)
      if (growPct > 1) {
        threadsGrow = Math.ceil(ns.growthAnalyze(target, growPct, host.cpuCores))
        ns.tprintf('Threads required for grow: %d', threadsGrow)
        const growSecInc = ns.growthAnalyzeSecurity(threadsGrow, target, host.cpuCores)
        ns.tprintf('Grow increases security by: %f', growSecInc)
        threadsWeakenGrow = Math.ceil(growSecInc / ns.weakenAnalyze(1, host.cpuCores))
        ns.tprintf('Weaken required to mitigate grow: %d', threadsWeakenGrow)
      }
    }
    const threadsHack = Math.ceil(ns.hackAnalyzeThreads(target, server.moneyAvailable))
    ns.tprintf('Threads required for hack: %d', threadsHack)
    const hackSecInc = ns.hackAnalyzeSecurity(threadsHack, target)
    ns.tprintf('Hack increases security by: %f', hackSecInc)
    const threadsWeackenHack = Math.ceil(hackSecInc / ns.weakenAnalyze(1, host.cpuCores))
    ns.tprintf('Weaken required to mitigate hack: %d', threadsWeackenHack)
    
    ns.tprintf('-------------------------------')
    const totalThreadsWeaken = threadsWeackenHack+threadsWeakenGrow+threadsWeaken
    const ramWeaken = ns.getScriptRam('weaken-single.js')*totalThreadsWeaken
    const ramGrow = ns.getScriptRam('grow-single.js')*threadsGrow
    const ramHack = ns.getScriptRam('hack-single.js')*threadsHack
    ns.tprintf('Total weaken threads: %d (%d GB RAM)', totalThreadsWeaken, ramWeaken)
    ns.tprintf('Total grow threads: %d (%d GB RAM)', threadsGrow, ramGrow)
    ns.tprintf('Total hack threads: %d (%d GB RAM)', threadsHack, ramHack)
  
    if (ramWeaken+ramGrow < ns.getServerMaxRam('home')-ns.getServerUsedRam('home') && await ns.prompt('Run weaken+grow?')) {
      ns.exec('weaken-single.js', 'home', totalThreadsWeaken, target)
      ns.exec('grow-single.js', 'home', threadsGrow, target)
    }
  }
  
  function msToText(time) {
    const min = Math.floor(time/60000)
    const sec = (time-(min*60000))/1000
    return min+' minutes '+sec.toFixed(3)+' seconds'
  }