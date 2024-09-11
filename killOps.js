const cidrSubnet = require("ip").cidrSubnet;
const toLong = require("ip").toLong;

const READ_OPS = ["command", "query", "getmore"];
const WRITE_OPS = ["command", "query", "getmore", "insert", "update", "delete", "remove"];
const ATLAS_PROJECT_CIDR = '192.168.240.0/21';

let username = process.env["MONGODB_USER"]; //username eg: admin
let password = process.env["MONGODB_PASSWORD"]; //password eg: password
let MONGO_URI = process.env["MONGO_URI"]; //MONOGDB URI
let KILL_OP_MODE = process.env["KILL_OP_MODE"] || 0; //Kill op mode when sets to 1 kills the op, else it prints the slow ops
let MAX_SECS_THRESHOLD = 1; //max secs eg: 60
let READS_ONLY = false; //target only reads, eg: true

let COMMANDS_LIST = !READS_ONLY ? WRITE_OPS : READ_OPS; //only reads or all

//get long values from IP
function getRangeFromCIDR(cidr) {
    const subnetInfo = cidrSubnet(cidr);

    const startIp = toLong(subnetInfo.networkAddress);
    const endIp = toLong(subnetInfo.broadcastAddress);

    return {
        startIp,
        endIp
    };
}

//split and get long value from client ip
function splitAndGetIp(ipWithPort) {
    const [ip, port] = ipWithPort.split(':');
    return toLong(ip);
}

// get internal ip ranges to exclude
const range = getRangeFromCIDR(ATLAS_PROJECT_CIDR);

let slowOpsPipeline = [{
    $currentOp: {
        allUsers: true,
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
        "effectiveUsers": {
            $exists: true,
            $not: {
                $elemMatch: {
                    $or: [
                        { "user": "__system" },
                        { "db": { "$in": ["local", "config"] } }
                    ]
                }
            }
        },
        "secs_running": { $gt: MAX_SECS_THRESHOLD },
        "op": { $in: COMMANDS_LIST },
        "ns": { $nin: [/^local./, /^config./] },
    }
}
    , {
    $project: {
        "_id": 0,
        "client": 1,
        "currentOpTime": 1,
        "command": 1,
        "op": 1,
        "ns": 1,
        "opid": 1,
        "type": 1,
        "effectiveUsers": 1,
        "secs_running": 1,
        "appName": 1,
        "clientMetadata.driver": 1,
    }
}]

//connect to the database
db = connect(`${MONGO_URI}`);

//authenticate with user having killOpSessions role
db.getSiblingDB("admin").auth(username, password);

const slowOps = db.getSiblingDB("admin").aggregate(slowOpsPipeline).toArray();

const externalSlowOps = slowOps.filter(ops => {
    const clientIp = splitAndGetIp(ops.client);
    return !(clientIp > range.startIp && clientIp < range.endIp);
});

if (KILL_OP_MODE) {
    //KILL ALL SLOW OPS
    externalSlowOps.forEach(ops => {
        db.getSiblingDB("admin").killOp(ops.opid);
        print(`Killed client ${ops.client} operation with id: ${ops.opid} and appName: ${ops.appName || "BLANK"}, namespace: ${ops.ns}, effectiveUsers: ${JSON.stringify(ops.effectiveUsers) || "BLANK"}, command:  ${JSON.stringify(ops.command) || "BLANK"}`)
    })
} else {
    print(externalSlowOps);
}