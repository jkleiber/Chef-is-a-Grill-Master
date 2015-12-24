var ctx;

var Drawings = function(context)
{
	this.ctx = context;
}

Drawings.prototype.drawSprite = function(sprite,x,y)
{
	ctx.drawImage(sprite.getImage(),x,y);
}

Drawings.prototype.drawText = function(text,font,x,y)
{
	ctx.font = font;
	ctx.fillText(text,x,y);
}