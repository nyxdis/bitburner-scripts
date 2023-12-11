import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
  if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
    ns.tprintf('max servers purchased')
    ns.exit()
  }

  const money = ns.getServerMoneyAvailable('home')
  let ram = 8
  while (money > ns.getPurchasedServerCost(ram)) {
    ram += ram
  }
  const hostname = ns.purchaseServer('psrv', ram / 2)
  ns.tprintf('purchased server %s', hostname)
  ns.scp(['newserver/grow.js', 'newserver/weaken.js', 'newserver/hack.js', 'newserver/OP.js'], hostname)
  ns.exec('newserver/OP.js', hostname, 1, 'true')
}