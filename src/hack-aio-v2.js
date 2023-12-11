const victim = {
  hostname: '',
  minSec: 0,
  baseSec: 0,
  maxMoney: 0,
}

const purchaseRam = 8

/** @param {NS} ns */
export async function main(ns) {

  victim.hostname = ''
  victim.minSec = 0
  victim.baseSec = 0
  victim.maxMoney = 0

  while (true) {
    if (victim.hostname != '') {
      ns.tprintf('Hack AiO v2: current target: %s', victim.hostname)
    }

    // find best target
    findTarget(ns)

    // purchase or upgrade servers
    if (ns.getPurchasedServerLimit() > ns.getPurchasedServers().length) {
      purchaseServers(ns)
    } else {
      await upgradeServers(ns)
    }

    // attack that target
    await attackTarget(ns)
  }

}

/** @param {NS} ns */
function purchaseServers(ns) {
  let owned = ns.getPurchasedServers().length
  const max = ns.getPurchasedServerLimit()
  if (owned >= max) {
    ns.tprint('Hack AiO v2: purchased all servers')
    return
  }

  const cost = ns.getPurchasedServerCost(purchaseRam)

  while (owned < max && ns.getServerMoneyAvailable("home") > cost) {
    let hostname = ns.purchaseServer("pserv", purchaseRam)
    ns.tprintf("Hack AiO v2: bought new server '%s'", hostname)
    ns.scp(['hack-single.js', 'weaken-single.js', 'grow-single.js'], hostname)
    owned++
  }
}

/** @param {NS} ns */
async function upgradeServers(ns) {
  const servers = ns.getPurchasedServers()

  const money = ns.getServerMoneyAvailable('home')
  const firstServer = servers[0]
  let currentRam = ns.getServerMaxRam(firstServer)
  if (currentRam == ns.getPurchasedServerMaxRam) {
    ns.tprint('Hack AiO v2: servers upgraded to max ram')
    return
  }
  let newRam = currentRam
  let cost = 0
  while ((cost * servers.length) < money) {
    newRam = newRam * 2
    cost = ns.getPurchasedServerUpgradeCost(firstServer, newRam)
  }

  // last upgrade in loop was too expensive -> downgrade
  newRam /= 2
  if (currentRam == newRam) {
    ns.tprintf('Hack AiO v2: server upgrades too expensive')
    return
  }

  ns.tprintf('Hack AiO v2: upgrading servers to %d GB RAM', newRam)

  for (const s of servers) {
    await waitForCompletion(ns, s)
    ns.upgradePurchasedServer(s, newRam)
  }
}

/** @param {NS} ns */
async function attackTarget(ns) {
  const curSec = ns.getServerSecurityLevel(victim.hostname)
  const curMoney = ns.getServerMoneyAvailable(victim.hostname)

  if (curSec > victim.minSec * 1.1) {
    const pct = (1 - ((curSec - victim.minSec) / (victim.baseSec - victim.minSec))) * 100
    ns.tprintf('(1-((%f-%f)/(%f-%f)))*100', curSec, victim.minSec, victim.baseSec, victim.minSec)
    ns.tprintf('Hack AiO v2: Security level %.3f/%.3f (%d %%) => weaken', curSec, victim.minSec, pct)
    await deploy(ns, 'weaken-single.js', victim.hostname)
    await ns.weaken(victim.hostname)
  } else if (curMoney < victim.maxMoney * 0.9) {
    ns.tprintf('Hack AiO v2: Money %.3fm/%.3fm (%d %%)=> grow', curMoney / 1e6, victim.maxMoney / 1e6, curMoney / victim.maxMoney * 100)
    await deploy(ns, 'grow-single.js', victim.hostname)
    await ns.grow(victim.hostname)
  } else {
    ns.tprintf('Hack AiO v2: Hacking')
    await deploy(ns, 'hack-single.js', victim.hostname)
    await ns.hack(victim.hostname)
  }
}

/** @param {NS} ns */
async function deploy(ns, script, target) {
  // deploy on home
  await waitForCompletion(ns, 'home')
  const maxRam = ns.getServerMaxRam('home')
  const usedRam = ns.getServerUsedRam('home')
  const freeRam = maxRam - usedRam
  const reqRam = ns.getScriptRam(script, 'home')
  const threads = Math.floor((freeRam * 0.9) / reqRam)
  ns.exec(script, 'home', threads, target)

  // deploy on purchased servers
  const servers = ns.getPurchasedServers()
  for (const s of servers) {
    const maxRam = ns.getServerMaxRam(s)
    const reqRam = ns.getScriptRam(script, s)
    const threads = Math.floor(maxRam / reqRam)
    await waitForCompletion(ns, s)
    ns.exec(script, s, threads, target)
  }
}

/** @param {NS} ns */
async function waitForCompletion(ns, target) {
  let idle = true
  do {
    const weakenRunning = ns.scriptRunning('weaken-single.js', target)
    const growRunning = ns.scriptRunning('grow-single.js', target)
    const hackRunning = ns.scriptRunning('hack-single.js', target)
    if (weakenRunning || growRunning || hackRunning) {
      idle = false
      const task = (weakenRunning ? 'weaken' : (growRunning ? 'grow' : 'hack'))
      ns.tprintf("Hack AiO v2: server '%s' busy with %s", target, task)
      await ns.sleep(10000)
    }
  } while (!idle)
}

/** @param {NS} ns */
function findTarget(ns) {
  const servers = ns.scan()

  for (const s of servers) {
    check(ns, s, 'home')
  }
}

/** @param {NS} ns */
function check(ns, target, source) {
  const max = ns.getServerMaxMoney(target)
  const hackable = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target)

  if (hackable && victim.maxMoney < max && root(ns, target)) {
    ns.tprintf('Hack AiO v2: New target: %s', target)
    victim.hostname = target
    victim.maxMoney = max
    victim.baseSec = ns.getServerBaseSecurityLevel(target)
    victim.minSec = ns.getServerMinSecurityLevel(target)
  }

  const servers = ns.scan(target)
  for (const s of servers) {
    if (s != source)
      check(ns, s, target)
  }
}

/** @param {NS} ns */
function root(ns, target) {
  if (ns.hasRootAccess(target)) {
    return true
  }

  ns.tprintf("Hack AiO v2: no root on '%s', rooting", target)

  if (ns.fileExists("BruteSSH.exe", "home"))
    ns.brutessh(target)
  if (ns.fileExists("FTPCrack.exe", "home"))
    ns.ftpcrack(target)
  if (ns.fileExists("relaySMTP.exe", "home"))
    ns.relaysmtp(target)
  if (ns.fileExists("HTTPWorm.exe", "home"))
    ns.httpworm(target)
  if (ns.fileExists("SQLInject.exe", "home"))
    ns.sqlinject(target)

  try {
    ns.nuke(target)
    ns.tprintf('Hack AiO v2: root successful')
    return true
  } catch (e) {
    ns.tprintf('Hack AiO v2: root failed')
    return false
  }
}