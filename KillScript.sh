#!/bin/bash

# THE SCRIPT NEEDS FOLLOWING ENV_VARIABLES FOR EXECUTION
# MONGODB_USER 
# MONGODB_PASSWORD 
# MONGODB_OPS_MAX_SECS
# MONGODB_TARGET_ONLY_READS

# Define log file
LOGFILE="kill_ops.log"

# Get the current timestamp
timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Log function to append messages to the log file with timestamp
log_message() {
  echo "$(timestamp) - $1" >> "$LOGFILE"
}

# Execute mongosh command and redirect both stdout and stderr to log file
MONGO_URI="mongodb+srv://replicacluster.4xwip.mongodb.net/"
SCRIPT_FILE="killOps.js"

log_message "Starting mongosh script execution."

mongosh "$MONGO_URI" --file "$SCRIPT_FILE" >> "$LOGFILE" 2>&1

if [ $? -eq 0 ]; then
  log_message "MongoDB script executed successfully."
else
  log_message "Error occurred during MongoDB script execution."
fi

log_message "MongoDB script execution finished."

