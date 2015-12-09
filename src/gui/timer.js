function Timer(domWindow){
  this.domWindow = domWindow;
  this.seconds = 0;
  this.callback = null;
  this.intervalID = 0;
}

Timer.prototype.start = function(){
  var self = this;
  this.intervalID = this.domWindow.setInterval(function(){
    self.performTick();
  }, 1000);
  this.callback(this.seconds);
}

Timer.prototype.stop = function(){
  this.domWindow.clearInterval(this.intervalID);
  this.seconds = 0;
}

Timer.prototype.performTick = function(){
  this.seconds++;
  if (typeof(this.callback) == "function"){
    this.callback(this.seconds);
  }
}

Timer.prototype.setTickCallback = function(callback){
  this.callback = callback;
}

module.exports = Timer;
