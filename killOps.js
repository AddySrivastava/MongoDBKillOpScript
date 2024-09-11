let user = process.env["MONGODB_USER"]; //username eg: admin
let password = process.env["MONGODB_PASSWORD"]; //password eg: password
let MAX_SECS_THRESHOLD = parseInt(process.env["MONGODB_OPS_MAX_SECS"], 10);; //max secs eg: 60
let READS_ONLY = process.env["MONGODB_TARGET_ONLY_READS"]; //target only reads, eg: true 
const READ_OPS = ["command", "query", "getmore"];
const WRITE_OPS = ["command", "query", "getmore", "insert", "update", "delete", "remove"];

let COMMANDS_LIST = READS_ONLY ? WRITE_OPS : READ_OPS  ; //only reads or all

db.getSiblingDB("admin").auth(user, password);

let slowOps = db.getSiblingDB("admin").aggregate([{
    $currentOp: {
        allUsers: false,
        idleConnections: false,
        idleCursors: false,
        idleSessions: true,
        localOps: false,
        backtrace: true,
    }
},
{
    $match: {
        "type": "op",
        "appName": {
            $nin: [
                /^mongot/,
                /^MongoDB Automation Agent/,
                /^MongoDB Monitoring Module/,
                /^MongoDB CPS Module/,
            ]
        },
        "client": { $exists: true },
        "active": true,
        "secs_running": { $gt: MAX_SECS_THRESHOLD },
        "op": { $in: COMMANDS_LIST },
        "ns": { $nin: [/^local./, /^config./] },
    }
}, {
    $project: {
        "_id": 0,
        "client": 1,
        "currentOpTime": 1,
        "microsecs_running": 1,
        "op": 1,
        "ns": 1,
        "opid": 1,
        "type": 1,
        "effectiveUsers": 1,
        "secs_running": 1,
        "appName": 1,
        "clientMetadata.driver": 1,
    }
}])


slowOps.map(ops => {
    print(`Killing operation with id: ${ops.opid} with appName: ${ops.appName} and ns: ${ops.ns} and effectiveUsers as ${JSON.stringify(ops.effectiveUsers)}`)
    db.killOp(ops.opid)
})
