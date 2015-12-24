//Timer.js

var Timer = function(){};

Timer.prototype.getTimestamp = function()
{
	if(window.performance.now)
	{
		return window.performance.now();
	}
	else if(window.performance.webkitNow)
	{
		return window.performance.webkitNow();
	}
	else
	{
		return new Date().getTime();
	}
};