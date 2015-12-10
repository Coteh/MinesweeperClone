function MineBlock(x, y){
  this.x = x;
  this.y = y;
  this.container = new PIXI.Container();
  this.container.interactive = false;
  this.sprite = new PIXI.Sprite(null);
  this.numberIndicator = new PIXI.Text("", {font: "bold 24px Arial", fill: "#ff0000", align: "right"});
  this.indicatorSprite = new PIXI.Sprite(null);
  this.setPosition(x, y);
  this.resetNumberIndicator();
  this.numberIndicator.visible = false;
  this.indicatorSprite.visible = false;
  this.sprite.interactive = true;
  this.numberIndicator.interactive = false;
  this.container.addChild(this.sprite);
  this.container.addChild(this.numberIndicator);
  this.container.addChild(this.indicatorSprite);
}

MineBlock.prototype.setPosition = function(x, y){
  this.x = x;
  this.y = y;
  this.container.x = x * 32;
  this.container.y = y * 32;
  this.numberIndicator.x = 8;
  this.numberIndicator.y = 4;
  this.indicatorSprite.x = 0;
  this.indicatorSprite.y = 0;
}

MineBlock.prototype.resetNumberIndicator = function(){
  this.numberIndicator.text = 'F';
  this.numberIndicator.style.fill = "#ff0000";
}

MineBlock.prototype.setIndicatorSpriteVisibility = function(expression){
  this.indicatorSprite.visible = expression;
}

MineBlock.prototype.setTexture = function(tex){
  this.sprite.texture = tex;
}

MineBlock.prototype.setIndicatorTexture = function(tex){
  this.indicatorSprite.texture = tex;
}

MineBlock.prototype.setLeftDown = function(func){
  var block = this;
  this.sprite.mousedown = function(mouseData){
    func(block, mouseData);
  };
}

MineBlock.prototype.setLeftRelease = function(func){
  var block = this;
  this.sprite.click = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setRightRelease = function(func){
  var block = this;
  this.sprite.rightclick = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setMouseEnter = function(func){
  var block = this;
  this.sprite.mouseover = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.setMouseOut = function(func){
  var block = this;
  this.sprite.mouseout = function(mouseData){
    func(block, mouseData);
  }
}

MineBlock.prototype.enableInteraction = function(expression){
  this.sprite.interactive = expression;
}

module.exports = MineBlock;
