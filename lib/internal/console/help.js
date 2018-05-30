'use strict';
const meow = require('meow');

module.exports = function (args) {
  const cli = meow(`
    Usage: matman [options] [command]

    Commands:
        init                                     Initialize project.
        build         <srcPath>                  Convert local handler to npm package.
        build-handler <srcPath> <distPath> [-sa] Convert local handler to standard handler.

    Options:
        --version, -[v]           Print version and exit successfully.
        --help, -[h]              Print this help and exit successfully.

    Report bugs to https://github.com/matmanjs/matman-cli/issues.
  `);

  return cli.showHelp(0);
};
