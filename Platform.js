var x;
var y;
var w;
var h;

var Platform = function(x,y,w,h){
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
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