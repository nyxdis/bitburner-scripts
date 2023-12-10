/** @param {NS} ns */
export async function main(ns) {
    let numNodes = ns.hacknet.numNodes()
    let purchaseNum
    if (ns.args.length == 1) {
      purchaseNum = ns.args[0]
    } else {
      const maxNodes = ns.hacknet.maxNumNodes()
      if (maxNodes == Infinity) {
        ns.tprintf('Cannot purchase infinite number of nodes')
        ns.exit()
      }
      purchaseNum = maxNodes-numNodes
    }
    const cont = await ns.prompt('Purchase '+purchaseNum+' hacknet nodes?')
    if (!cont) {
      ns.exit()
    }
  
    for (let i = numNodes; i < numNodes+purchaseNum; i++) {
      ns.tprintf('purchasing node %d', i)
      const moneyAvailable = ns.getServerMoneyAvailable('home')
      const cost = ns.hacknet.getPurchaseNodeCost()
      if (cost > moneyAvailable) {
        ns.tprintf('Cannot purchase node %d, not enough money', i)
        ns.exit()
      } else {
        ns.hacknet.purchaseNode()
      }
    }
  }