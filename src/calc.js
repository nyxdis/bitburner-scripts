/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length != 1) {
      ns.tprintf('[!] missing target')
      ns.exit()
    }
    const target = ns.args[0]
  
    const server = ns.getServer(target)
  
    let ramRequired = 0
  
    let threadsWeaken0 = 1
    while (server.hackDifficulty > ns.weakenAnalyze(1) && server.minDifficulty < (server.hackDifficulty - ns.weakenAnalyze(threadsWeaken0))) {
      threadsWeaken0++
    }
    ns.tprint('threads required for weaken: ', threadsWeaken0)
  
    /** hack calc */
    const threadsHack = Math.floor(ns.hackAnalyzeThreads(target, server.moneyAvailable))
    ns.tprint('threads required for hack: ', threadsHack)
    ns.tprint('hack time: ', msToText(ns.getHackTime(target)))
    const hackSecInc = ns.hackAnalyzeSecurity(threadsHack)
    ns.tprint('hack increases security by ', hackSecInc)
    ramRequired += ns.getScriptRam('hack-single.js')*threadsHack
    const moneyLeft = server.moneyAvailable - ns.hackAnalyze(target)*threadsHack
    ns.tprint('money left on server: ', moneyLeft)
    ns.tprint('money available on server: ', server.moneyAvailable)
  
    /** weaken calc */
    let threadsWeaken1 = 1
    while (server.hackDifficulty > ns.weakenAnalyze(1) && server.minDifficulty < (server.hackDifficulty + hackSecInc - ns.weakenAnalyze(threadsWeaken1))) {
      threadsWeaken1++
    }
    ns.tprint('threads required for weaken: ', threadsWeaken1)
    const weakenTime = ns.getWeakenTime(target)
    ns.tprint('weaken time: ', msToText(weakenTime))
    ramRequired += ns.getScriptRam('weaken-single.js')*threadsWeaken1
  
    /** grow calc */
    const growPct = server.moneyMax/moneyLeft
    let threadsGrow = 0
    let growSecInc = 0
    if (growPct >= 1) {
      threadsGrow = Math.ceil(ns.growthAnalyze(target, growPct))
      growSecInc = ns.growthAnalyzeSecurity(threadsGrow)
    }
    ns.tprint('threads required for grow: ', threadsGrow)
    const growTime = ns.getGrowTime(target)
    ns.tprint('grow time: ', msToText(growTime))
    ns.tprint('grow increases security by ', growSecInc)
    const growDelay = weakenTime - growTime + 10000
    ns.tprint('delaying grow start by ', msToText(growDelay))
    ramRequired += ns.getScriptRam('grow-single.js')*threadsGrow
    
    /** weaken calc */
    let threadsWeaken2 = 1
    while (growSecInc > ns.weakenAnalyze(1) && growSecInc < ns.weakenAnalyze(threadsWeaken2)) {
      threadsWeaken2++
    }
    ns.tprint('threads required for weaken: ', threadsWeaken2)
    const weakenDelay = 20000
    ns.tprint('delaying weaken start by ', msToText(growDelay))
    ramRequired += ns.getScriptRam('weaken-single.js')*threadsWeaken2
    
    ns.tprint('RAM required: ', ramRequired, ' GB')
    const homeRam = ns.getServerMaxRam('home')*0.9
    ns.tprint('RAM on home: ', homeRam, ' GB')
    ramRequired -= homeRam
    ns.tprint('RAM per pserv required: ', Math.ceil(ramRequired/25), ' GB')
  
    /*
    ns.exec('single-v2/hack.js', host, threadsHack, 0, target)
    ns.exec('single-v2/weaken.js', host, threadsWeaken1, 0, target)
    ns.exec('single-v2/grow.js', host, threadsGrow, growDelay, target)
    ns.exec('single-v2/weaken.js', host, threadsWeaken2, weakenDelay, target)
    */
  }
  
  function msToText(time) {
    const min = Math.floor(time/60000)
    const sec = (time-(min*60000))/1000
    return min+' minutes '+sec+' seconds'
  }