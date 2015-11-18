var forEach = require("mout/array/forEach");
var fs   = require('fs');
var http = require('http');
var cmdLancher = require('./cmdLancher.js');
var path = require('path');
var Class = require('uclass');


var rimrafSync = require('rimraf').sync

var npmregistryEndPoint = "registry.npmjs.org";


module.exports = new Class({

  Binds : ["getPackage" , "clone" , " npmInstall"],
  initialize : function(module_name){
    this._module_name = module_name;
    this._git = new cmdLancher('git' , "node_modules");
  },

  getPackage : function(cb){
    if(fs.existsSync("./node_modules/"+ this._module_name+"/package.json")){
       cb(null , require(path.resolve(process.cwd() , "node_modules/"+ this._module_name +"/package.json")));
    }else {
      console.log('get from' , npmregistryEndPoint + '/' + this._module_name)
      http.get({
          host: npmregistryEndPoint,
          path: '/' + this._module_name
      }, function(response){
        var data = ''
        response.on('data', function (chunk) {
          data += chunk;
        });
        response.once('end', function () {
          try {
            data = JSON.parse(data)
            cb(null , data);
          } catch (e) {
            cb(e)
          }
        });
      })
    }
  },

  clone : function(PackageRepo , cb){
    if(fs.existsSync("./node_modules/"+ this._module_name))
    rimrafSync("./node_modules/"+ this._module_name);
    this._git.run(['clone', PackageRepo, this._module_name] , cb)
  },

  npmInstall : function(){
    var spawned = require("child_process").exec("npm install" ,{
      cwd: "node_modules/" + this._module_name
    })
    spawned.stdout.pipe(process.stdout);
  },

  init : function(){
    var self = this;
    this.getPackage(function(err , package){
      if(err)
        return console.log("error on get package " , err);
      PackageRepo = package.repository.url;
      self.clone(PackageRepo , function(err , data){
        if(err)
          return console.log("error on clone " , err);
        self.npmInstall();
      })
    })
  }
})
