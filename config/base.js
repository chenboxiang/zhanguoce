var config = {
    // session
    session: {
        "secret": "zhanguoce",
        "redisStore": {
            "host": "localhost",
            "port": "6379",
            "db": 0,
            // session过期时间: 4hour
            "ttl": 14400,
            "prefix": "sess:"
        }
    }
}

module.exports = config;