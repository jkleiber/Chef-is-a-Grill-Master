//Class that handles all the maps

var platforms;
var lavas;
//add various enemy arrays
var steaks, steakMids, startSteaks;
var transitions;
var grills;

var levelNames;

var xMaxes;
var yMaxes;

var StageLoader = function(canvas){
	
	this.xMaxes = [800,1200];
	this.yMaxes = [0,-200];
	this.levelNames = ["Tutorial","The First Cookout"];
	this.platforms = [	[new Platform(0,444,canvas.width, (480-444)),new Platform(500,330,300,20), new Platform(200,240,150,20), new Platform(100,100,100,20)],
						[new Platform(0,444,1200, (480-444)), new Platform(0,300,100, 20), new Platform(900,300,100, 20), new Platform(0,150,100, 20), new Platform(0,30,100, 20), new Platform(200,-30,600, 20)]
						];
	this.lavas = [	[],
					[new Platform(120,444,900,(480-444))]
					];
	this.steaks = [	[new Sprite(180,160,"./graphics/steak.png"), new Sprite(400,380,"./graphics/steak.png"), new Sprite(600,220,"./graphics/steak.png"), new Sprite(750,220,"./graphics/steak.png")],
					[new Sprite(20,268,"./graphics/steak.png"), new Sprite(20,116,"./graphics/steak.png"), new Sprite(880,267,"./graphics/steak.png"), new Sprite(230,-94,"./graphics/steak.png"), new Sprite(330,-94,"./graphics/steak.png"), new Sprite(430,-94,"./graphics/steak.png"), new Sprite(530,-94,"./graphics/steak.png"), new Sprite(630,-94,"./graphics/steak.png"), new Sprite(730,-94,"./graphics/steak.png")]
					];
	this.steakMids = [	[160,380,220,220],
						[268,116,267,-94,-94,-94,-94,-94,-94]
						];
	this.startSteaks = [4,100];
	this.grills = [	[100,36],
					[1100,380]
					];
	
};

StageLoader.prototype.getLevelName = function(level)
{
	return this.levelNames[level];
}

StageLoader.prototype.getPlatforms = function(level)
{
	return this.platforms[level];
}

StageLoader.prototype.getLavas = function(level)
{
	return this.lavas[level];
}

StageLoader.prototype.getSteaks = function(level)
{
	return this.steaks[level];
}

StageLoader.prototype.getSteakMids = function(level)
{
	return this.steakMids[level];
}

StageLoader.prototype.getStartSteaks = function(level)
{
	return this.startSteaks[level];
}

StageLoader.prototype.getTransitions = function(level)
{
	return this.transitions[level];
}

StageLoader.prototype.getGrillX = function(level)
{
	return this.grills[level][0];
}

StageLoader.prototype.getGrillY = function(level)
{
	return this.grills[level][1];
}

StageLoader.prototype.getXMax = function(level)
{
	return this.xMaxes[level];
}

StageLoader.prototype.getYMax = function(level)
{
	return this.yMaxes[level];
}


