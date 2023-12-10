/** @param {NS} ns */
export async function main(ns) {
    const servers = ns.getPurchasedServers()
  
    const money = ns.getServerMoneyAvailable('home')
    const lastServer = servers[servers.length-1]
    let currentRam = ns.getServerMaxRam(lastServer)
    let newRam = currentRam
    let cost = 0
    while ((cost*servers.length) < money) {
      newRam = newRam*2
      cost = ns.getPurchasedServerUpgradeCost(lastServer, newRam)
      ns.tprintf("[!] cost for upgrade to %d GB RAM: $%.3fm (total $%.3fm)", newRam, cost/1e6, (cost*servers.length)/1e6)
    }
    // last upgrade in loop was too expensive -> downgrade
    newRam /= 2
    if (currentRam == newRam) {
      ns.tprintf("[-] upgrade too expensive, aborting")
      ns.exit()
    }
    //const threads = Math.floor(newRam/2.4)
  
    for (const s of servers) {
      cost = ns.getPurchasedServerUpgradeCost(s, newRam)
      currentRam = ns.getServerMaxRam(s)
      ns.tprintf("[+] upgrading '%s' to %d GB RAM (was %d GB) for $%d", s, newRam, currentRam, cost)
      ns.killall(s)
      if (ns.upgradePurchasedServer(s, newRam))
        ns.tprint("[+] upgrade successful")
      else
        ns.tprint("[-] upgrade failed")
      //ns.exec('hack-aio.js', s, threads, victim)
      await ns.sleep(100)
    }
  }