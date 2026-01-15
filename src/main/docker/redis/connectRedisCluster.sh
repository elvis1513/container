#!/usr/bin/env bash

function log {
    echo "[$(date)]: $*"
}

log "Start Redis Cluster builder"
sleep 5

log "Connect all Redis containers"
redis-cli \
    --cluster-replicas 1 \
    --cluster-yes \
    --cluster create \
        $(host container-redis|awk '{print $4}'):6379 \
        $(host container-redis-1|awk '{print $4}'):6379 \
        $(host container-redis-2|awk '{print $4}'):6379 \
        $(host container-redis-3|awk '{print $4}'):6379 \
        $(host container-redis-4|awk '{print $4}'):6379 \
        $(host container-redis-5|awk '{print $4}'):6379
