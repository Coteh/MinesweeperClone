function DigitBoard(x, y, amtOfDigits, textureArr) {
    this.container = new PIXI.Container();
    this.setPosition(x, y);
    this.amtOfDigits = 0;
    this.digitArr = new Array();
    this.digitSpriteArr = new Array();
    this.digitBackGraphic = new PIXI.Graphics();
    this.digitBackGraphic.beginFill(0x000000);
    this.container.addChild(this.digitBackGraphic);
    this.digitBackGraphic.drawRect(0, 0, 0, 0);
    this.setDigitAmount(amtOfDigits);
    this.textureArr = null;
    this.setTextureSet(textureArr);
}

/* Set the position of the entire digit board. */
DigitBoard.prototype.setPosition = function (x, y) {
    this.container.x = x;
    this.container.y = y;
};

/* Set amount of digits on this digit board. */
DigitBoard.prototype.setDigitAmount = function (amt) {
    //Grabbing previous amount (should be 0 on initialization)
    var prevAmt = this.amtOfDigits;
    //Saving the new amount
    this.amtOfDigits = amt;
    // console.log("New amount of digit sprites: " + this.amtOfDigits + " and old amount of digit sprites: " + prevAmt);
    //Checking if there's any digits to add/remove
    if (this.amtOfDigits > prevAmt) {
        //If there's more digits now than before, add the new ones
        for (var i = prevAmt; i < this.amtOfDigits; i++) {
            var digit = 0;
            this.digitArr.push(digit);
            var digitSprite = new PIXI.Sprite(
                this.textureArr != null ? this.textureArr[this.digitArr[i]] : null
            );
            this.digitSpriteArr.push(digitSprite);
            digitSprite.x += i * 32 + i * 2;
            this.container.addChild(digitSprite);
            // console.log("Added digit sprite " + i + " at X: " + digitSprite.x + ", Y: " + digitSprite.y);
        }
    } else if (this.amtOfDigits < prevAmt) {
        //Else, if there's less digits now than before, delete the excess
        for (var i = this.amtOfDigits; i < prevAmt; i++) {
            this.container.removeChild(this.digitSpriteArr[i]);
        }
        this.digitArr.splice(this.amtOfDigits, prevAmt - this.amtOfDigits);
        this.digitSpriteArr.splice(this.amtOfDigits, prevAmt - this.amtOfDigits);
    }
    //Else, if we just set it to the same amount as before, don't do anything
    //Now, adjust the back graphic
    //TODO unhardcode the height of digit back graphic
    this.digitBackGraphic.width = this.amtOfDigits * 32 + this.amtOfDigits * 2;
    this.digitBackGraphic.height = 57;
};

/* Set the array of textures this digit board will be using.
    The array will have ten elements from 0-9, which line up with
    the possible digits it can be. */
DigitBoard.prototype.setTextureSet = function (textureArr) {
    //Save the texture
    this.textureArr = textureArr;
    //Set the texture for all digits currently
    for (var i = 0; i < this.amtOfDigits; i++) {
        this.digitSpriteArr[i].texture = this.textureArr[this.digitArr[i]];
    }
    //Now, adjust the back graphic TODO unhardcode the height
    this.digitBackGraphic.drawRect(0, 0, this.amtOfDigits * 32 + this.amtOfDigits * 2, 57);
};

/* Set the number that the digit board will display.
    Will be truncated depending on how many digits are available. */
DigitBoard.prototype.setDisplayNumber = function (num) {
    //Check for negative numbers, make them 0
    if (num < 0) {
        num = 0;
    }
    //Get number of digits in num
    var numDigitCount = Math.floor(Math.log10(num) + 1);
    //Check for numbers too big for the digitboard to handle, make the num 999...n
    if (numDigitCount > this.amtOfDigits) {
        num = Math.pow(10, this.amtOfDigits) - 1;
        numDigitCount = this.amtOfDigits;
    }
    //Cut each digit off from num and place it onto the digit board
    var digits = [];
    var tenPow = 0;
    for (var p = this.amtOfDigits - 1; p >= 0; p--) {
        if (num > 0) {
            tenPow = Math.pow(10, p);
            digits.push(Math.floor(num / tenPow));
            num = num % tenPow;
        } else {
            digits.push(0);
        }
    }
    // console.log(digits);
    for (var i = 0; i < this.amtOfDigits; i++) {
        this.digitSpriteArr[i].texture = this.textureArr[digits[i]];
    }
};

module.exports = DigitBoard;
