/** @param {NS} ns */
export async function main(ns) {
    const servers = ns.getPurchasedServers()
    for (const s of servers) {
      deploy(ns, s)
      await ns.sleep(10000)
    }
  }
  
  /** @param {NS} ns */
  function deploy(ns, target) {
    ns.killall(target)
    ns.scp(['newserver/weaken.js','newserver/grow.js','newserver/hack.js','newserver/OP.js'], target)
    ns.exec('newserver/OP.js', target, 1, 'true')
  }