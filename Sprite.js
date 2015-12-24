//Sprite Class

var image;
var canDraw = false;

var x=0;
var y=0;
var w=0;
var h=0;

var isUp = true;

var scorable = false;

var orient = "right";
var Sprite = function(){

};

var Sprite = function(x,y){
	this.setX(x);
	this.setY(y);
};

var Sprite = function(x,y,path){
	this.setX(x);
	this.setY(y);
	
	this.image = new Image();
	this.image.src = path;
	
	
	this.image.onload = function(){
		//console.log("Sprite image loaded - " + this.width +" x " + this.height);
		//this.setWidth(this.width);
		//this.setHeight(this.height);
	}
};


Sprite.prototype.getImage = function()
{
	return this.image;
}
Sprite.prototype.getX = function()
{
	return this.x;
}
Sprite.prototype.getY = function()
{
	return this.y;
}
Sprite.prototype.getOrientation = function()
{
	return this.orient;
}

Sprite.prototype.setHover = function(hover)
{
	this.isUp = hover;
}

Sprite.prototype.setImage = function(file)
{
	//console.log(file);
	this.image = new Image();
	this.image.src = file;
	
	var wid,hei;
	
	this.image.onload = function(){
		//console.log("Sprite image loaded - " + this.width +" x " + this.height);
		//this.setWidth(this.width);
		//this.setHeight(this.height);
	}
	
}
Sprite.prototype.setX = function(x)
{
	this.x = x;
}
Sprite.prototype.setY = function(y)
{
	this.y = y;
}
Sprite.prototype.setWidth = function(wid)
{
	this.w = wid;
}
Sprite.prototype.setHeight = function(hi)
{
	this.h = hi;
}
Sprite.prototype.setOrientation = function(o)
{
	this.orient = o;
}

Sprite.prototype.draw = function(Context)
{
	//console.log("drawing at X:" + this.getX() + " Y:" + this.getY());
	Context.drawImage(this.getImage(),this.getX(),this.getY());
}