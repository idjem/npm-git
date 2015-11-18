var ChildProcess = require('child_process');
var Class        = require("uclass");

module.exports = new Class({
  Binds : ['run' , '_schedule'],

  initialize : function(cmd , baseDir){
    this._runCache = [];
    this._baseDir = baseDir;
    this._outputHandler = null;
    this._cmd = cmd;
  },

  run : function (command, then) {
      if (typeof command === "string") {
        command = command.split(" ");
      }
      this._runCache.push([command, then]);
      this._schedule();
      return this;
  },

  _schedule : function () {
    var self = this ;
    if (!this._childProcess && this._runCache.length) {
      var task = this._runCache.shift();
      var command = task[0];
      var then = task[1];

      var stdOut = [];
      var stdErr = [];

      var spawned = ChildProcess.spawn(this._cmd, command.slice(0), {
        cwd: this._baseDir
      });


      spawned.stdout.on('data', function (buffer) { stdOut.push(buffer); });
      spawned.stdout.pipe(process.stdout);
      spawned.stderr.on('data', function (buffer) { stdErr.push(buffer); });

      spawned.on('close', function (exitCode, exitSignal) {
        delete self._childProcess;

        if (exitCode && stdErr.length) {
          stdErr = Buffer.concat(stdErr).toString('utf-8');
          self._runCache = [];
          then.call(self, stdErr, null);
        }else {
          then.call(self, null, Buffer.concat(stdOut).toString('utf-8'));
        }
        process.nextTick(self._schedule);
      })

      this._childProcess = spawned;
      if (this._outputHandler) {
        this._outputHandler(command[0],
        this._childProcess.stdout,
        this._childProcess.stderr);
      }
    }
  }
})
