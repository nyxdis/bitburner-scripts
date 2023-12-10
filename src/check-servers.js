const bestServer = {
  name: "",
  maxMoney: 0
}

let servers

let debugLog = false

/** @param {NS} ns */
export async function main(ns) {
  servers = []
  for (const s of ns.scan()) {
    debug(ns, "Checking '%s'", s)
    check(ns, s, 'home')
  }

  servers.sort((a, b) => a.maxMoney - b.maxMoney)

  const hackLvl = ns.getHackingLevel()
  for (const s of servers) {
    if (s.name == 'w0r1d_d43m0n')
      continue
      
    const reqHackLvl = ns.getServerRequiredHackingLevel(s.name)
    const curr = ns.getServerMoneyAvailable(s.name)
    const pct = curr/s.maxMoney*100
    if (s.maxMoney > 0) {
      const hackable = hackLvl >= reqHackLvl
      ns.tprintf("Server '%s': %.3fm/%.3fm (%d %%) (hackable: %s)", s.name, curr/1e6, s.maxMoney/1e6, pct, hackable)
      if (!hackable) {
        ns.tprintf("Server %s not hackable, skill too low: %d/%d", s.name, hackLvl, reqHackLvl)
      }
    } else {
      debug(ns, "Skipping server '%s', no money", s.name)
    }
  }

  ns.tprintf("Best target: '%s' ($%.3fm)", bestServer.name, bestServer.maxMoney/1e6)
}

/** @param {NS} ns */
function check(ns, target, source) {
  const max = ns.getServerMaxMoney(target)

  const hackable = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)

  if (hackable) {
    if (bestServer.maxMoney < max) {
      bestServer.name = target
      bestServer.maxMoney = max
    }
  }

  servers.push({name: target, maxMoney: max})

  for (const s of ns.scan(target)) {
    if (s != source) {
      debug(ns, "Checking neighbor '%s' of '%s'", s, source)
      check(ns, s, target)
    } else {
      debug(ns, "Skipping '%s' because we're coming from there", source)
    }
  }  
}

function debug(ns, msg, ...args) {
  if (debugLog) {
    ns.tprintf(msg, args)
  }
}