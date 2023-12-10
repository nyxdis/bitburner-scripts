/** @param {NS} ns */
export async function main(ns) {
  const otherServers = ns.scan()
  const target = ns.args[0]

  for(const server of otherServers) {
    test(ns, server, 'home', target)
  }
}

/**
 * @param {NS} ns
 * @param {String} server
 * @param {String} source
 * @param {String} target
 **/
function test(ns, server, source, target) {
  const script = 'hack-aio.js'

  ns.tprintf("\n[+] copy script '%s' to '%s'...", script, server)
  ns.scp(script, server)

  try {
    ns.tprintf("[+] checking root access")
    if (!ns.hasRootAccess(server)) {
      ns.tprintf('[!] rooting ', server)
      if (ns.fileExists("BruteSSH.exe", "home"))
        ns.brutessh(server)
      if (ns.fileExists("FTPCrack.exe", "home"))
        ns.ftpcrack(server)
      if (ns.fileExists("relaySMTP.exe", "home"))
        ns.relaysmtp(server)
      if (ns.fileExists("HTTPWorm.exe", "home"))
        ns.httpworm(server)
      if (ns.fileExists("SQLInject.exe", "home"))
        ns.sqlinject(server)
      try {
        ns.nuke(server)
      } catch {}
    }

    ns.tprintf("[+] checking if script running")
    const runnable = ns.getScriptRam(script, server) < ns.getServerMaxRam(server)
    if (runnable && !ns.isRunning(script, server, target)) {
      ns.tprintf("[!] script not running, executing")
      ns.killall(server)
      const maxRam = ns.getServerMaxRam(server)
      const scriptRam = ns.getScriptRam(script)
      const threads = Math.floor(maxRam / scriptRam)
      ns.exec(script, server, threads, target)
    }

    ns.tprintf("[+] checking neighbors")
    const neighbors = ns.scan(server)
    for (const n of neighbors) {
      if (n != source) {
        ns.tprintf("[+] infiltrating '%s'", n)
        test(ns, n, server, target)
      }
    }

  } catch (e) {
    ns.tprintf(e)
  }
}