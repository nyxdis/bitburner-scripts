import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    if (ns.args.length !== 1 || typeof ns.args[0] !== 'string') {
        ns.exit()
    }
    const target = ns.args[0]
    const weakenRam = ns.getScriptRam('/newserver/weaken.js')
    const growRam = ns.getScriptRam('/newserver/grow.js') * 12
    const totalRam = weakenRam + growRam
    prime(ns, target, 'home', totalRam)
    for (const server of ns.getPurchasedServers()) {
        prime(ns, target, server, totalRam)
    }
}

function prime(ns: NS, target: string, _host: string, totalRam: number) {
    const host = ns.getServer(_host)
    const freeRam = host.maxRam - host.ramUsed
    const threadMult = Math.floor(freeRam / totalRam)
    ns.tprint('Running simple-prime with ', threadMult, ' threads on ', host.hostname)
    ns.exec('/newserver/grow.js', host.hostname, 12 * threadMult, target, 0)
    ns.exec('/newserver/weaken.js', host.hostname, threadMult, target, 0)
}