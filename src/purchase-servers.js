/** @param {NS} ns */
export async function main(ns) {
    while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
      const money = ns.getServerMoneyAvailable('home')
      let ram = 2
      while (money > ns.getPurchasedServerCost(ram)) {
        ram += ram
      }
      const hostname = ns.purchaseServer('pserv', ram/2)
      ns.tprintf('purchased server %s', hostname)
      ns.scp('archive/weaken.js', hostname)
      const scriptRam = ns.getScriptRam('archive/weaken.js', hostname)
      const maxRam = ns.getServerMaxRam(hostname)
      const threads = Math.floor(maxRam/scriptRam)
      ns.exec('archive/weaken.js', hostname, threads, 'ecorp')
    }
  }