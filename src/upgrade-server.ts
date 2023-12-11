import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  if (ns.args.length !== 1 || typeof ns.args[0] !== 'string') {
    ns.exit()
  }
  const target = ns.args[0]
  const money = ns.getServerMoneyAvailable('home')
  const currentRam = ns.getServerMaxRam(target)
  if (currentRam >= ns.getPurchasedServerMaxRam()) {
    ns.tprintf('server already at max')
    ns.exit()
  }
  let newRam = currentRam
  let cost = 0
  while (cost < money && newRam <= ns.getPurchasedServerMaxRam()) {
    newRam = newRam * 2
    cost = ns.getPurchasedServerUpgradeCost(target, newRam)
    ns.tprintf("[!] cost for upgrade to %d GB RAM: $%.3fm", newRam, cost / 1e6)
  }

  newRam /= 2
  if (currentRam === newRam) {
    ns.tprintf("[-] upgrade too expensive, aborting")
    ns.exit()
  }

  cost = ns.getPurchasedServerUpgradeCost(target, newRam)
  ns.tprintf("[+] upgrading '%s' to %d GB RAM (was %d GB) for $%.3fm", target, newRam, currentRam, cost / 1e6)
  ns.killall(target)
  if (ns.upgradePurchasedServer(target, newRam))
    ns.tprint("[+] upgrade successful")
  else
    ns.tprint("[-] upgrade failed")

  ns.scp(['newserver/OP.js', 'newserver/hack.js', 'newserver/grow.js', 'newserver/weaken.js'], target)
  ns.exec('newserver/OP.js', target, 1, 'true')

}