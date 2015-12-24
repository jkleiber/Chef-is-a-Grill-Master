//Interpolating Renderer
var timer = new Timer();

var gameLoop;
var context;
var canvas;

var running = true;
var next_tick;
var startTime;

var loops;
var ticks_per_sec = 25;
var skip_ticks = 1000/ticks_per_sec;

var Renderer = function(context,canvas,loop)
{
	this.canvas = canvas;
	this.context = context;
	this.gameLoop = loop;
};
// Interpolation Stuff that might not work with JS
Renderer.prototype.run = function()
{
	startTime = timer.getTimestamp();
	next_tick = 0;
	
	while(running)
	{
		var delta = timer.getTimestamp() - startTime;
		
		loops = 0;
		
		while(delta > next_tick && loops < 5) //5 = MAX_FRAME_SKIP
		{
			this.gameLoop.update();
			next_tick += skip_ticks;
			loops++;
		}
		
		var interpolation = (delta + skip_ticks - next_tick) / skip_ticks;
		
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.gameLoop.paint(interpolation);
	}
}


Renderer.prototype.pause = function()
{
	running=false;
}
Renderer.prototype.pause = function()
{
	running=true;
	this.run();
}