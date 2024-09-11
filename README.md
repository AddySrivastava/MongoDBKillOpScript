# MongoDB Slow Operations Monitor and Kill Script

This script connects to a MongoDB instance, monitors long-running operations, and optionally kills external slow operations based on a set of criteria. It uses environment variables for configuration and checks for operations based on a CIDR range.

## Prerequisites

- Node.js, mongosh has in-built node.js interepreter 
- MongoDB instance with atlasAdmin and killOpSession built-in roles
- globally installed`ip` package for IP manipulation

## Environment Variables

The script expects the following environment variables to be set:

- `MONGODB_USER`: MongoDB username (e.g., `admin`)
- `MONGODB_PASSWORD`: MongoDB password (e.g., `password`)
- `KILL_OP_MODE`: If set to `true`, slow external operations will be killed
- `MONGO_URI`: MongoDB cluster uri eg - mongodb+srv://replicacluster.4xwip.mongodb.net/admin

## Command Types

- **Read Operations**: `command`, `query`, `getmore`
- **Write Operations**: `command`, `query`, `getmore`, `insert`, `update`, `delete`, `remove`

## CIDR Configuration

- **ATLAS_PROJECT_CIDR**: `192.168.240.0/21` (This CIDR range is used to identify internal IP addresses to exclude from the slow operations filtering)

### Exclude Internal Operations

- External operations are filtered based on the CIDR range of the MongoDB Atlas project.

### Execution Mode

- **Kill Mode (`KILL_OP_MODE`)**: If enabled, all slow external operations are killed.
- **Monitor Mode**: If disabled, the details of external slow operations are printed without killing them.

## Usage

1. Install the required package:
   ```bash
   npm install -g ip
   ```

2. Set the required environment variables:
```
export MONGODB_USER=admin
export MONGODB_PASSWORD=password
export KILL_OP_MODE=true
export MONGODB_URI=mongodb+srv://replicacluster.4xwip.mongodb.net/admin
```
3. Run the bash script
```
./KillScript.sh

```

