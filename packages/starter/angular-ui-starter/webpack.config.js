module.exports = (config) => {
    config.resolve.fallback = {
        crypto: false
    };

    return config;
};
