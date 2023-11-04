var MenuOption = require('./menuoption');

function CheckBox(title, textOptions){
    this.menuOption = new MenuOption(title, textOptions);
    this.container = this.menuOption.container;
    this.uncheckedTex = null;
    this.checkedTex = null;
    this.checkBoxSprite = new PIXI.Sprite(null);
    this.menuOption.graphic.addChild(this.checkBoxSprite);
    this.checkBoxSprite.x = -32 - 4;
    this.isChecked = false;
    this.checkBoxAction = null;
    var self = this;
    this.menuOption.setPressAction(function(){
        if (typeof(this.checkBoxAction) == "function") this.checkBoxAction(!self.isChecked);
        self.setCheck(!self.isChecked);
    }.bind(this));
}

CheckBox.prototype.setCheckTextures = function(uncheckedTex, checkedTex){
    this.uncheckedTex = uncheckedTex;
    this.checkedTex = checkedTex;
    this.checkBoxSprite.texture = (this.isChecked) ? this.checkedTex : this.uncheckedTex;
}

CheckBox.prototype.setCheckBoxAction = function(action){
    this.checkBoxAction = action;
}

CheckBox.prototype.setCheck = function(expression){
    this.checkBoxSprite.texture = (expression) ? this.checkedTex : this.uncheckedTex;
    this.isChecked = expression;
}

module.exports = CheckBox;
