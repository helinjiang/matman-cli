'use strict';

module.exports = function (ctx) {

  const cmd = ctx.cmd;

  cmd.register('start', 'Start matman service', {}, require('./start'));
};
