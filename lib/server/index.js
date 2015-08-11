/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi')

var hapi_plugins = require('./hapi_plugins')

module.exports = function () {
  return function (env_config, callback) {
    var options = {
      connections: {
        routes: {
          cors: {override: false},
          payload: {maxBytes: 1048576 * 10} // 10 MB
        }
      }
    }

    if (env_config.debug) {
      options.debug = {
        log: ['error'],
        request: ['error']
      }
    }

    var server = new Hapi.Server(options)

    env_config.hooks.runStatic('server.pack.pre', [server])

    server.connection({
      port: env_config.www_port,
      labels: ['web']
    })

    server.connection({
      port: env_config.admin_port,
      labels: ['admin']
    })

    // register plugins against the server pack
    hapi_plugins.forEach(function (plugin) {
      server.register({
        register: plugin,
        options: {
          app: env_config
        }
      }, function (error) {
        if (error) {
          console.error('Failed to load a plugin:', error)
        }
      })
    })

    env_config.hooks.runStatic('server.pack.post', [server])

    server.start(function () {
      console.log('WWW:   ', env_config.www_link)
      console.log('Admin: ', env_config.admin_link)

      return callback()
    })
  }
}