var x;
var y;
var w;
var h;

var type = "black";

var Platform = function(x,y,w,h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.type = "black";
};
var Platform = function(x,y,w,h,type){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.type = type;
};

Platform.prototype.getX = function()
{
	return this.x;
}

Platform.prototype.getY = function()
{
	return this.y;
}

Platform.prototype.getWidth = function()
{
	return this.w;
}

Platform.prototype.getHeight = function()
{
	return this.h;
}

Platform.prototype.setType = function(type)
{
	this.type = type;
}
Platform.prototype.getType = function()
{
	return this.type;
}