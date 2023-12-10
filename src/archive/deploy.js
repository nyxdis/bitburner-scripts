/** @param {NS} ns */
export async function main(ns) {
    const victim = ns.args[0]
    if (ns.args.length != 1 && ns.args.length != 3) {
      ns.tprintf('[!] missing victim')
      ns.exit()
    }
  
    const servers = ns.getPurchasedServers()
    for (let i = 0; i < servers.length; i++) {
      deploy(ns, servers[i], i, victim)
      await ns.sleep(1000)
    }
  }
  
  /** @param {NS} ns */
  function deploy(ns, target, idx, victim) {
    let weakens = 5
    let grows = 5
    if (ns.args.length == 3) {
      weakens = ns.args[1]
      grows = ns.args[2]
    }
    grows += weakens
  
    let script = ''
    if (idx < weakens) {
      script = 'weaken'
    } else if (idx < grows) {
      script = 'grow'
    } else {
      script = 'hack'
    }
    script += '.js'
  
    ns.tprintf("[+] deploying '%s' on '%s'", script, target)
    ns.scp(script, target)
  
    const maxRam = ns.getServerMaxRam(target)
    const reqRam = ns.getScriptRam(script, target)
    const threads = Math.floor(maxRam/reqRam)
  
    ns.killall(target, true)
    ns.tprintf("[+] running '%s' with %d threads", script, threads)
    ns.exec(script, target, threads, victim)
  
  }