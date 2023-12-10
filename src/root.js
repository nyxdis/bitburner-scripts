/** @param {NS} ns */
export async function main(ns) {
  const otherServers = ns.scan()

  for(const server of otherServers) {
    root(ns, server, 'home')
  }
}

/** @param {NS} ns */
function root(ns, target, source) {
  if (!ns.hasRootAccess(target)) {
    ns.tprintf('[!] rooting %s', target)
    let openPorts = 0
    if (ns.fileExists("BruteSSH.exe", "home")) {
      ns.brutessh(target)
      openPorts++
    }
    if (ns.fileExists("FTPCrack.exe", "home")) {
      ns.ftpcrack(target)
      openPorts++
    }
    if (ns.fileExists("relaySMTP.exe", "home")) {
      ns.relaysmtp(target)
      openPorts++
    }
    if (ns.fileExists("HTTPWorm.exe", "home")) {
      ns.httpworm(target)
      openPorts++
    }
    if (ns.fileExists("SQLInject.exe", "home")) {
      ns.sqlinject(target)
      openPorts++
    }

    if (openPorts >= ns.getServerNumPortsRequired(target)) {
      ns.nuke(target)
    } else {
      ns.tprintf('[!] not enough ports open')
    }
  }

  const neighbors = ns.scan(target)
  for (const n of neighbors) {
    if (n != source) {
      root(ns, n, target)
    }
  }

}