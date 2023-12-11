// original: https://www.reddit.com/r/Bitburner/comments/rqfgws/comment/hrb0p8u/?utm_source=share&utm_medium=web2x&context=3

import { NS } from "@ns"

type Payload = [string, number, number, number, number, number, number]

// for debugging
const skipInitialPrime = false

const serverFortifyAmount = 0.002 // Amount by which server's security increases when its hacked/grown
const serverWeakenAmount = 0.05 // Amount by which server's security decreases when weakened

/**
 * OP main
 * 
 * @param ns NetScript
 */
export async function main(ns: NS): Promise<void> {

    //OP.js original script--it was from this post that the idea of rapid hack-grow-weak firing came about: 
    //https://www.reddit.com/r/Bitburner/comments/rm48o1/the_best_hacking_approach_ive_seen_so_far/
    //https://pastebin.com/nRv0VtQm
    //https://pastebin.com/sY5MYcUj
    //check out math checks (I adjusted the math, see README for further details) + Formulas.exe alternative (post augmentation)

    //I did a terrible job with the tail log. I tried to rough/minimally emulate what this person did: https://playgame.tips/bitburner-intermediate-auto-farm. That coder's log is beautiful.

    //This coder had a very clean approach for finding all/rootable/hackable Servers and most of that code is used here:
    //https://www.reddit.com/r/Bitburner/comments/rk6ltp/565_gb_script_for_hacking_servers/
    //The only thing I changed was the findOptimal function (to calculate the kpi for the rapid firing approach) and the main module to call the hack-grow-weaken cycles according to the rapid firing principle: 

    ns.disableLog('ALL')

    const host = ns.getHostname() // Server to run scripts on

    const allServers = await findAllServers(ns)  // finds all servers
    let hServers = await findHackable(ns, allServers)    // finds and nukes hackable servers

    let [payloadOptimal, payloadn00dles] = await findOptimal(ns, hServers) // finds optimal server to hack amongst all hackable servers based on $/ms/RAM kpi

    let proceed
    if (ns.args.length === 1) {
        proceed = (ns.args[0] === 'true')
    } else {
        proceed = await ns.prompt("Switch from n00dles to " + payloadOptimal[0] + " and start hacking at " + payloadOptimal[4] + " $/ms/GB with h: " + payloadOptimal[1] + " and g: " + payloadOptimal[2] + " threads per cycle?")
    }

    let payloadTarget = proceed ? payloadOptimal : payloadn00dles

    ns.tail()

    if (!skipInitialPrime) {
        await primeOptimal(ns, payloadTarget[0], 'home')
    }

    const hostRamBuffer = (host === 'home' ? 50 : 0)
    const ramUsable = Math.max(0, ns.getServerMaxRam(host) - ns.getScriptRam('/newserver/OP.js', host) - hostRamBuffer) // getting total RAM I can use that doesnt include the OP script

    let run = 0 // # of run on current target

    // eslint-disable-next-line no-constant-condition
    while (true) {
        run++
        const lastOptimalServer = payloadTarget[0]
        const server = ns.getServer(lastOptimalServer)
        const hackDifficulty = server.hackDifficulty ?? 1
        const minDifficulty = server.minDifficulty ?? 1
        if (hackDifficulty - minDifficulty > serverWeakenAmount) {
            await primeOptimal(ns, payloadTarget[0], 'home')
        }

        let ramRequired = payloadTarget[3]
        let shiftCount = Math.floor(ramUsable / ramRequired) // number of cycles for this run
        const threadMult = Math.max(Math.floor(shiftCount / 200), 1) // reduce number of processes, increase multithreading
        ramRequired *= threadMult
        shiftCount = Math.floor(shiftCount / threadMult)

        // number of threads
        const hThreads = payloadTarget[1] * threadMult
        const gThreads = payloadTarget[2] * threadMult
        const wThreads = threadMult

        const hackFortify = ns.hackAnalyzeSecurity(hThreads)
        const growFortify = ns.growthAnalyzeSecurity(gThreads)
        const weakenEffect = ns.weakenAnalyze(wThreads)
        if (hackFortify + growFortify > weakenEffect) {
            ns.tprintf('Error: hack+grow raise security by %f+%f=%f, weaken decreases by %f', hackFortify, growFortify, (hackFortify + growFortify), weakenEffect)
            ns.exit()
        }

        await log(ns, payloadTarget, host, shiftCount, NaN, run)

        for (let i = 0; i < shiftCount; i++) {
            // runtime for weaken/hack/grow
            const wTime = ns.getWeakenTime(payloadTarget[0])
            const hTime = wTime / 4
            const gTime = hTime * 16 / 5

            const sleepTime = Math.max(1000, wTime / shiftCount) // time between cycle executes

            const hOffset = sleepTime / 2
            const gOffset = hOffset / 2

            // time between actions
            const hSleep = wTime - hTime - hOffset // Getting time for hack, shaving off more to make sure it beats both weaken and growth
            const gSleep = wTime - gTime - gOffset // Getting the time to have the Growth execution sleep, then shaving some off to beat the weaken execution

            if (ramRequired < ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) {
                const actWTime = ns.getWeakenTime(payloadTarget[0])
                if (Math.abs(wTime - actWTime) > gOffset) {
                    ns.tprintf('Warning: wTime diff (wTime: %.3f, actWTime: %.3f) bigger than gOffset (%.3f) (diff: %.3f)', wTime, actWTime, gOffset, Math.abs(wTime - actWTime))
                }
                const hRes = ns.exec('/newserver/hack.js', host, hThreads, payloadTarget[0], hSleep, i) // i is a fake argument to create a separate instance of the script
                const gRes = ns.exec('/newserver/grow.js', host, gThreads, payloadTarget[0], gSleep, i) // ditto i
                const wRes = ns.exec('/newserver/weaken.js', host, wThreads, payloadTarget[0], 0, i) // ditto i
                if (hRes === 0 || gRes === 0 || wRes === 0) {
                    ns.tprintf('cycle %d failed, hRes %d, gRes %d, wRes %d', i, hRes, gRes, wRes)
                }
            } else {
                ns.tprintf('cycle %d failed, not enough RAM available', i)
            }
            await ns.sleep(sleepTime)
        }

        await ns.sleep(1000)

        if (proceed) {
            hServers = await findHackable(ns, allServers);
            [payloadOptimal, payloadn00dles] = await findOptimal(ns, hServers)
            payloadTarget = payloadOptimal
            if (lastOptimalServer !== payloadOptimal[0]) {
                const wTime = ns.getWeakenTime(payloadTarget[0])
                await ns.sleep(host === 'home' ? wTime : 0) // ensuring all cycles including the last one fired are completed before priming
                await primeOptimal(ns, payloadTarget[0], 'home', host === 'home' ? 0 : wTime)
                run = 0
            }
        }
    }
}


/**
 * Prime target server, bringing security to minimum and money to maximum
 * 
 * @param ns NetScript
 * @param _tServer target server hostname
 * @param _hServer host server hostname
 * @param minSleep minimum time the script needs to sleep
 */
async function primeOptimal(ns: NS, _tServer: string, _hServer: string, minSleep = 0): Promise<void> {
    const tServer = ns.getServer(_tServer)
    const hServer = ns.getServer(_hServer)
    const host = ns.getServer()
    const player = ns.getPlayer()
    const ms = tServer.minDifficulty ?? 1
    let cs = tServer.hackDifficulty ?? 1
    const mm = tServer.moneyMax ?? 0
    const ma = tServer.moneyAvailable ?? 0

    let sleepTime = 0
    let gThreads = 0
    let wThreads = 0

    //Priming the server.  Max money and Min security must be achieved for this to work
    if (ma < mm) {
        gThreads = ns.formulas.hacking.growThreads(tServer, player, tServer.moneyMax ?? 0, hServer.cpuCores)
        sleepTime = ns.formulas.hacking.growTime(tServer, player)
        cs += ns.growthAnalyzeSecurity(gThreads, tServer.hostname, hServer.cpuCores)
    }

    //If Max Money is true, making sure security level is at its minimum
    if (cs - ms > serverFortifyAmount) {
        wThreads = Math.ceil((cs - ms) / ns.weakenAnalyze(1, tServer.cpuCores))
        sleepTime = ns.formulas.hacking.weakenTime(tServer, player)
    }

    const scriptRam = ns.getScriptRam('/newserver/grow.js') * gThreads + ns.getScriptRam('/newserver/weaken.js') * wThreads
    const ramHome = hServer.maxRam - hServer.ramUsed
    const ramHost = host.maxRam - host.ramUsed
    if (ramHome < scriptRam && ramHost < scriptRam) {
        ns.tprintf("Error: cannot prime host '%s', not enough RAM available (%s required, %s usable on home, %s usable on host)", tServer.hostname, ns.formatRam(scriptRam), ns.formatRam(ramHome), ns.formatRam(ramHost))
        ns.exit()
    }
    const primer = ramHome > scriptRam ? hServer : host

    if (gThreads > 0) {
        ns.exec('/newserver/grow.js', primer.hostname, gThreads, tServer.hostname, 0)
    }
    if (wThreads > 0) {
        ns.exec('/newserver/weaken.js', primer.hostname, wThreads, tServer.hostname, 0)
    }

    await logPriming(ns, tServer.hostname, hServer.hostname, Math.max(sleepTime, minSleep))
}


/**
 * Find server with highest money gain per time and memory usage
 * 
 * @param ns NetScript
 * @param hackableServersList list of hackable servers
 * @returns optimal server for hacking
 */
async function findOptimal(ns: NS, hackableServersList: string[]): Promise<Payload[]> {

    const tempPlayer = ns.getPlayer()

    const ssGrow = 2 * serverFortifyAmount
    const ssHack = serverFortifyAmount
    const ssWeaken = serverWeakenAmount
    const ramHack = ns.getScriptRam("/newserver/hack.js")
    const ramGrow = ns.getScriptRam("/newserver/grow.js")
    const ramWeaken = ns.getScriptRam("/newserver/weaken.js")

    let payload: Payload = ['home', 0, 0, 0, 0, 0, 0]
    let payn00dles: Payload = ['home', 0, 0, 0, 0, 0, 0]
    let optimalVal = 0

    for (const currServer of hackableServersList) {
        const tempServer = ns.getServer(currServer)

        const sMM = tempServer.moneyMax ?? 0 // Sever Max Money (s=Server)
        if (sMM === 0) {
            continue // skip calc when there's no money
        }
        tempServer.hackDifficulty = tempServer.minDifficulty // We want server hacking calculations from the Formulas.exe api to evaluate at Minimum Security not Current Security

        const wTime = ns.formulas.hacking.weakenTime(tempServer, tempPlayer) // server weakenTime dictates a hack>grow>weaken cycle

        const sPercentageGrow = ns.formulas.hacking.growPercent(tempServer, 1, tempPlayer)
        const sPercentageHack = ns.formulas.hacking.hackPercent(tempServer, tempPlayer)
        const sHackChance = ns.formulas.hacking.hackChance(tempServer, tempPlayer)

        const a = ssGrow / Math.log(sPercentageGrow) //          Eqtn 23.2.1.1: Let a = ssGrow / log(sPercentageGrow),
        const b = Math.log(1 - sPercentageHack) //               Eqtn 23.2.1.2: Let b = log(1 - sPercentageHack),
        const x = ssHack / ssGrow * Math.log(sPercentageGrow) * Math.exp((ssWeaken - a * b) / a) //      Eqtn 23.4.1: let x = ssHack / a * e ^ ((ssWeaken - a*b) / a),
        const wl = await wLambert(ns, x) // y=W(x) is the Lambert function of x such that x = y*e^y
        const hh = ssGrow / ssHack / Math.log(sPercentageGrow) * wl //   Eqtn 23.4.2: h = ssGrow / ssHack / log(sPercentageGrow) * W(x) 
        const gg = Math.ceil((Math.log(hh) + b) / Math.log(sPercentageGrow)) //     Eqtn 3.4: g = (log(h) + log(1 - sPercentageHack)) / log(sPercentageGrow)

        if (gg !== 12) {
            ns.tprintf('%s: gg is not 12, but %d', currServer, gg)
        }
        if (Math.floor(hh) !== 1) {
            ns.tprintf('%s: hh is not 1, but %d', currServer, Math.floor(hh))
        }

        const sMMc = sMM * sPercentageHack * Math.floor(hh) * sHackChance // Server Max Money hacked per cycle.
        const sMMc_dot = sMMc / wTime // Server Max Money hacked per cycle per second.

        const ramc = ramWeaken + ramHack * Math.floor(hh) + ramGrow * gg // Sever hack-grow-weaken RAM cost per cycle.
        const sMMc_dot_ram = sMMc_dot / ramc // Server Max Money hacked per cycle per second per GB RAM.

        if (sMMc_dot_ram >= optimalVal) {
            optimalVal = sMMc_dot_ram
            payload = [currServer, Math.floor(hh), gg, ramc, sMMc_dot_ram, wTime, sMMc]
        }

        if (currServer === 'n00dles') {
            payn00dles = [currServer, Math.floor(hh), gg, ramc, sMMc_dot_ram, wTime, sMMc]
        }
    }

    return [payload, payn00dles]
}


/**
 * 
 * @param ns NetScript
 * @param z 
 * @returns 
 */
async function wLambert(ns: NS, z: number): Promise<number> {

    let w0 = 0

    // for initial Lambert values, values are approximated via linear extrapolation per https://www.desmos.com/calculator/5kf9gammls
    if (z > Math.E) {
        w0 = Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z - Math.log(Math.log(z))))))))))))))))))) //decent initial approximation for z > e. See https://www.desmos.com/calculator/5kf9gammls.
    } else if (z === Math.E) {
        w0 = 1
    } else if (z >= 2.2) {
        w0 = 0.9 + (1 - 0.9) / (Math.E - 2.2) * (z - 2.2)
    } else if (z >= 1.4) {
        w0 = 0.7 + (0.9 - 0.7) / (2.2 - 1.4) * (z - 1.4)
    } else if (z >= 0.6) {
        w0 = 0.4 + (0.7 - 0.4) / (1.4 - 0.6) * (z - 0.6)
    } else if (z >= 0.1) {
        w0 = 0.0912 + (0.4 - 0.0912) / (0.6 - 0.1) * (z - 0.1)
    } else if (z >= 0.01) {
        w0 = 0.0099 + (0.0912 - 0.0099) / (0.1 - 0.01) * (z - 0.01)
    } else if (z > 0) {
        w0 = 0.0912 / 0.01 * z
    }
    let w = w0
    let w1
    let error = 1
    let i = 0
    let lambertHope: string | boolean = true

    while (Math.abs(error) > 0.01 && lambertHope) {
        w1 = w - (w - z * Math.exp(-w)) / (w + 1) // https://en.wikipedia.org/wiki/Lambert_W_function#Numerical_evaluation (Newton's method with the numerator and denominator multiplied by e^-wj for simplification)
        error = (w1 - w) / w1
        if (i % 100 === 0 && i !== 0) {
            lambertHope = await ns.prompt("Could not converge on the Lambert function after 10 x 100 loops. Initial values: z:" + z + " | w0:" + w0 + " --> Current value: wi:" + w1 + " | error: " + error + ". Continue for another 10 x 100 loops?")
            w = w1
            //} else if (i % 100 === 0 && i !== 0) {
            //    w = w1 + (w0 - w1) * 2 * (Math.min(1, Math.abs(error)) * (Math.random() - 0.5))
        } else {
            w = w1
        }
        i += 1
    }
    return w
}


/**
 * Scan the network for all servers
 * 
 * @param ns NetScript
 * @returns list of all discoverable servers
 */
async function findAllServers(ns: NS): Promise<string[]> {
    const q = []
    const serverDiscovered: { [key: string]: boolean } = {}

    q.push('home')
    serverDiscovered['home'] = true

    while (q.length) {
        const v = q.shift()

        const edges = ns.scan(v)

        for (let i = 0; i < edges.length; i++) {
            if (!serverDiscovered[edges[i]]) {
                serverDiscovered[edges[i]] = true
                q.push(edges[i])
            }
        }
    }
    return Object.keys(serverDiscovered)
}


/**
 * Find servers that are hackable with current hacking skill
 * 
 * @param ns NetScript
 * @param allServers list of servers to analyze
 * @returns list of hackable servers
 */
async function findHackable(ns: NS, allServers: string[]): Promise<string[]> {

    /**
    * Finds list of all hackable and all rootable servers. Also finds optimal server to hack.
    * A hackable server is one which you can hack, grow, and weaken.
    * A rootable server is one which you can nuke.
    * Returns a 2d array with list of hackable, rootable, and the optimal server to hack
    */

    const hackableServers = []
    let numPortsPossible = 0

    if (ns.fileExists('BruteSSH.exe', 'home')) {
        numPortsPossible++
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        numPortsPossible++
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        numPortsPossible++
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        numPortsPossible++
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        numPortsPossible++
    }

    const hackingLevel = ns.getHackingLevel()
    for (const server of allServers) {

        if (!ns.hasRootAccess(server) && ns.getServerNumPortsRequired(server) <= numPortsPossible) {
            if (ns.fileExists('BruteSSH.exe', 'home')) {
                ns.brutessh(server)
            }
            if (ns.fileExists('FTPCrack.exe', 'home')) {
                ns.ftpcrack(server)
            }
            if (ns.fileExists('relaySMTP.exe', 'home')) {
                ns.relaysmtp(server)
            }
            if (ns.fileExists('HTTPWorm.exe', 'home')) {
                ns.httpworm(server)
            }
            if (ns.fileExists('SQLInject.exe', 'home')) {
                ns.sqlinject(server)
            }
            ns.nuke(server)
        }

        //if your hacking level is high enough, add it to hackable servers list
        if (hackingLevel >= ns.getServerRequiredHackingLevel(server)) {
            hackableServers.push(server)
        }
    }

    return hackableServers
}


/**
 * Pretty print current hacking parameters to log
 * 
 * @param ns NetScript
 * @param ttserver target server parameters
 * @param hhserver host server hostname
 * @param countShift number of cycles per run
 * @param timeSleep time between cycle executions
 * @param run number of current run
 */
async function log(ns: NS, ttserver: Payload, hhserver: string, countShift: number, timeSleep: number, run: number): Promise<void> {

    const barFillHost = '═'.repeat(hhserver.length)
    const barFillTarget = '═'.repeat(ttserver[0].length)
    const spaceFill = ' '.repeat(hhserver.length + ttserver[0].length)

    ns.clearLog()
    ns.printf("╔══════════════════════════╦%s════════╦══════════%s╗", barFillHost, barFillTarget)
    ns.printf("║ Next cycle hacking stats ║ HOST: %s ║ TARGET: %s ║", hhserver, ttserver[0])
    ns.printf("╠══════════╦═══════════════╩%s════════╩══════════%s╣", barFillHost, barFillTarget)
    ns.printf("║ h        ║ %-30d   %s ║", ttserver[1], spaceFill)
    ns.printf("║ g        ║ %-30d   %s ║", ttserver[2], spaceFill)
    ns.printf("║ r        ║ %-30f   %s ║", ttserver[3], spaceFill)
    ns.printf("║ $/ms/GB  ║ %-30f   %s ║", ttserver[4], spaceFill)
    ns.printf("║ $/s      ║ %-30f   %s ║", (ttserver[6] / timeSleep) * 1000 / 1e6, spaceFill)
    ns.printf("║ run#     ║ %-30d   %s ║", run, spaceFill)
    ns.printf("║ #cycles  ║ %-30d   %s ║", countShift, spaceFill)
    ns.printf("║ cycle t  ║ %-30f   %s ║", ttserver[5], spaceFill)
    ns.printf("║ sleep t  ║ %-30f   %s ║", timeSleep, spaceFill)
    ns.printf("╚══════════╩═══════════════════════════════════%s%s╝", barFillHost, barFillTarget)
}


/**
 * Pretty print priming wait to log
 * 
 * @param ns NetScript
 * @param target target server hostname
 * @param host host server hostname
 * @param duration prime duration
 */
async function logPriming(ns: NS, target: string, host: string, duration: number): Promise<void> {
    const cycle = ["─", "\\", "|", "/"]

    const barFillHost = '═'.repeat(host.length)
    const barFillTarget = '═'.repeat(target.length)
    const spaceFill = ' '.repeat(host.length + target.length)

    const frameTime = 1000
    for (let i = 0; i < duration / frameTime; i++) {
        const c = cycle[i % 4]
        ns.clearLog()
        ns.printf("╔══════════════════════════╦%s════════╦══════════%s╗", barFillHost, barFillTarget)
        ns.printf("║ Priming server           ║ HOST: %s ║ TARGET: %s ║", host, target)
        ns.printf("╠══════════╦═══════════════╩%s════════╩══════════%s╝", barFillHost, barFillTarget)
        ns.printf("║ h        ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ g        ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ r        ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ $/ms/GB  ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ $/s      ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ run#     ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ #cycles  ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ cycle t  ║ %-20s             %s ║", c, spaceFill)
        ns.printf("║ sleep t  ║ %-20d             %s ║", (duration - i * frameTime) / 1000, spaceFill)
        ns.printf("╚══════════╩═══════════════════════════════════%s%s╝", barFillHost, barFillTarget)
        await ns.sleep(frameTime)
    }
}