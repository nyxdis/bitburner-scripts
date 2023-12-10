/** @param {NS} ns */
export async function main(ns) {
  if (ns.args.length != 1) {
    ns.tprint('Usage: find-server.js <hostname>')
  }
  ns.tprint(findServer(ns, 'home', ns.args[0]))
}

/** @param {NS} ns */
function findServer(ns, source, target) {
  for (const s of ns.scan()) {
    // don't recurse back
    if (s == source) {
      continue
    }

    // target found as neighbor from current
    if (s == target) {
      return source+'->'+s
    }

    findServer(ns, source, target)
  }
}