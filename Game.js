//Main Game

//Game Management
var timer = new Timer();
var stageLoader;
var firstRun=true;
var isPlaying;
var levelcomplete = false;
var nextLevelTransition=false;
var score = 0, levelscore=0;
var userControl = true;
var chefInPos = true;
var levelName;

//Transitions
var transitionFirstRun = true;
var transitionStart = 0, transitionEnd = 0;
var userCanConfirm = false;
var userConfirmedTransition = false;

//Victory Pause
var victoryFirst = true;
var victoryStart = 0, victoryEnd = 0;

/* Drawing */
var ctx;
var canvas;
var drawer;
//Scrolling Trickery
var refX = 0;
var refY = 0;
var oldRefX = 0, oldRefY = 0;
var refXSpeed = 0, refYSpeed = 0;

var xMax = 1200;
var yMax = 800;

var scrollStart = 0;
var scrollEnd = 0;
var scrollDiff = 0;

/* Controls */
var space = false;
var left=false, right=false;

/* Sprites */

//Chef
var chef;
var chef_speed = 0;
var oldChefX, oldChefY;
var chefRefX = 0;
var yVel = 0;
//var gravity = 1.2; <- original value from tutsplus
var gravity = .7;

//Hat
var hat;
var hat_gravity = .675;
var hat_yVel = 0;

//Grill
var grill;
var isFire = false;
var fire = 0;
var firstfire;

//Steak
var startSteaks = 10000;
var steaks;
var steakMids = [];
var enRoute = [];

//Block
var blocks = [];

/* Physics */
var defyPhysics = false; 
var nextPlatformY, nextY;
var landed = false;

//Jumps

var isJumping = false;
var isFalling = false;
var fallTargetLocked=false, targetPlatform=0;
var jumpTargetLocked=false;
var landY = 380; //default to land on ground


/* Map 
* 
* Platform 0 is always the ground 
* Platforms must be ordered from lowest to highest
*/
var level = level || 0;
var platforms,lavas;
var currentPlatform=0, fallIndex=0;

//When the canvas is ready, initialize
$(document).ready(function() {
/* Game Management & Drawing */
canvas = document.getElementById("renderView");
ctx = canvas.getContext("2d");
//ctx.canvas.width  = window.innerWidth;

drawer = new Drawings(ctx); //Be able to draw
stageLoader = new StageLoader(canvas); //Prepare for the stage

goToNextLevel();
/*
$([window, document]).focusin(function(){
      Game.run();
   }).focusout(function(){
      Game.pause();
   });
*/
   
/* Fixed Time Step Rendering */
Game.run = (function() {
	var loops = 0, 
		skipTicks = 1000 / Game.fps,
		maxFrameSkip = 10,
		nextGameTick = timer.getTimestamp();
		
	var renderStartTime = timer.getTimestamp();
  
	return function() {
		loops = 0;
		
		var delta = timer.getTimestamp() - renderStartTime;
		
		while (delta > nextGameTick && loops < maxFrameSkip) {
			Game.update();
			nextGameTick += skipTicks;
			loops++;
		}
		var interpolation = (delta + skipTicks - nextGameTick) / skipTicks;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		Game.paint(interpolation);
	};
})();

// Start the game loop
// Game._intervalId = setInterval(Game.run, 0);

// Optimal Refresh Rate  Thing 
(function() {
	var onEachFrame;
	if (window.webkitRequestAnimationFrame) 
	{
		onEachFrame = function(cb) {
			var _cb = function() 
			{ 
				cb(); 
				webkitRequestAnimationFrame(_cb); 
			}
			_cb();
		};
	} 
	else if (window.mozRequestAnimationFrame) 
	{
		onEachFrame = function(cb) {
			var _cb = function() 
			{ 
				cb(); 
				mozRequestAnimationFrame(_cb); 
			}
			_cb();
		};
	} 
	else 
	{
		onEachFrame = function(cb) 
		{
			setInterval(cb, 1000 / 60);
		}
	}
  
	window.onEachFrame = onEachFrame;
})();

window.onEachFrame(Game.run);

});

var Game = function(){};
Game.fps = 50;

//Physics from tutsplus (http://gamedevelopment.tutsplus.com/tutorials/quick-tip-avoid-game-watch-gravity-in-your-characters-jumps--gamedev-6759)
function jump() {
    if (isJumping == false) {
        yVel = -15;
		hat_yVel = -15;
        isJumping = true;
		jumpTargetLocked = false;
		isFalling = false;
		landed = false;
    }
}

function fall()
{
	if (isFalling == false) {
        yVel = -5;
		hat_yVel = -7;
        isFalling = true;
		fallTargetLocked = false;
		landed = false;
    }
}

function chefBestAbove()
{
	var highest=0;
	
	for(var ii=0;ii<platforms.length;ii++)
	{
		if(chef.y <= platforms[ii].y + refY - 64)
		{
			highest = ii;
		}
	}
	
	return highest;
}

/*
* Checks to see if Chef's feet are above or on the platform
*/
function canChefLand(ii)
{
	if(chef.orient == "right")
	{
		if((chef.x+40) >= platforms[ii].x && (chef.x + 23) <= (platforms[ii].x + platforms[ii].w))
		{
			return true;
		}
	}
	else
	{
		if((chef.x+40) >= platforms[ii].x && (chef.x + 23) <= (platforms[ii].x + platforms[ii].w))
		{
			return true;
		}
	}
	
	return false;
}

function whereWillChefJump()
{
	var land = false;
	var limit = chefBestAbove();
	
	for(ii=limit;ii>=0;ii--)
	{
		land = canChefLand(ii);
		
		if(land)
		{
			//landY = platforms[ii].y + refY - 64;
			currentPlatform = ii;
			targetPlatform = ii;
			//console.log("Chef will land at y = " + landY);
			break;
		}
	}
}

function whereWillChefFall()
{
	var land = false;
	var limit = fallIndex-1;
	
	for(ii=limit;ii>=0;ii--)
	{
		land = canChefLand(ii) && chef.y+64 <= platforms[ii].y + refY;
		
		if(land)
		{
			//landY = platforms[ii].y - 64 + refY;
			fallTargetLocked = true;
			targetPlatform = ii;
			//currentPlatform = ii;
			//console.log("Chef will fall to y = " + landY);
			break;
		}
	}
}

function hover(sprite,middle,tolerance)
{
	if(sprite.isUp)
	{
		sprite.y-=.25;
		if(sprite.y<(middle-tolerance))
		{
			sprite.isUp=false;
		}
	}
	else
	{
		sprite.y+=.25;
		if(sprite.y>(middle+tolerance))
		{
			sprite.isUp=true;
		}
	}
}

function chefCollision(sprite)
{
	if (chef.y+64<sprite.y+refY)
	{
        return false;
    }
    if (chef.y>sprite.y+sprite.h+refY)
	{
		return false;
    }
    if (chef.x+64<sprite.x)
	{
		return false;
    }
    if (chef.x>sprite.w+sprite.x)
	{
		return false;
    }
    return true;
}

function goToGrill(sprite)
{
	var pace = 0.1;
	var x = sprite.x;
	var y = sprite.y;
	
	xErr = (grill.x+32) - x;
	yErr = (grill.y+32) - y; //the grill top is actually 22 pixels below the image origin
	
	xErr *= pace;
	yErr *= pace;
	
	sprite.x += xErr;
	sprite.y += yErr;
	/*
	sprite.x = grill.x;
	sprite.y = grill.y;*/
}

function onGrill(sprite)
{
	if (grill.y+64+refY<sprite.y+refY)
	{
        return false;
    }
    if (grill.y+22+refY>sprite.y+sprite.h+refY)
	{
		return false;
    }
    if (grill.x+64<sprite.x)
	{
		return false;
    }
    if (grill.x>sprite.w+sprite.x)
	{
		return false;
    }
    return true;
}

function pidChef(x,y)
{
	var pace = 0.1;
	var cx = chef.x;
	var cy = chef.y;
	
	xErr = x - cx;
	yErr = y - cy; //the grill top is actually 22 pixels below the image origin
	
	xErr *= pace;
	yErr *= pace;
	
	chef.x += xErr;
	chef.y += yErr;
}
function chefInPosition(x,y)
{
	var sprite = chef;
	if (y+32<sprite.y)
	{
        return false;
    }
    if (y>sprite.y+64)
	{
		return false;
    }
    if (x+32<sprite.x)
	{
		return false;
    }
    if (x>64+sprite.x)
	{
		return false;
    }
    return true;
}

function goToMenu()
{
	//eventually the main menu will go here
}

function goToNextLevel()
{
	//set all flags back to default state
	//clear all platforms, steaks, and enemies from past level.
	//load data for next level, including transition
	//do cool transition, depending on the level
	//begin level
	
	startSteaks = stageLoader.getStartSteaks(level);
	
	if(firstRun)//only do this stuff on first run
	{
		/*Sprites*/
		chef = new Sprite(0,380);
		chef.setImage("./graphics/chef.png");
		chef.setOrientation("right");
		
		hat = new Sprite(0,380);
		hat.setImage("./graphics/hat_right.png");

		grill = new Sprite(stageLoader.getGrillX(1),stageLoader.getGrillY(1),"./graphics/grill.png");
		grill.setWidth(64);
		grill.setHeight(64);
		
		firstRun = false;
	}
	
	if(levelcomplete)
	{
		level++;
	}
	
	grill.setImage("./graphics/grill.png");
	
	chef.orient = "right";
	chef.x = 0;
	chef.y = 380;
	
	levelcomplete = false;
	isFire = false;
	levelscore = 0;
	
	platforms = stageLoader.getPlatforms(level);
	blocks = stageLoader.getBlocks(level);
	
	steaks = stageLoader.getSteaks(level);
	steakMids = stageLoader.getSteakMids(level);
	for(var ii=0;ii<steaks.length;ii++)
	{
		steaks[ii].setWidth(32);
		steaks[ii].setHeight(32);
		steaks[ii].scorable = true;
	}
	//console.log(steaks.length);
	
	lavas = stageLoader.getLavas(level);
	
	grill.setX(stageLoader.getGrillX(level));
	grill.setY(stageLoader.getGrillY(level));
	grill.setWidth(64);
	grill.setHeight(64);
	
	xMax = stageLoader.getXMax(level);
	yMax = stageLoader.getYMax(level);
	
	if(currentPlatform>0)
	{
		fall();
	}
	
	transitionEnd = timer.getTimestamp();
	if(transitionEnd - transitionStart >= 1000){
		userCanConfirm = true;
	}
	
	if(currentPlatform == 0 && chefInPos && userConfirmedTransition)
	{
		userControl = true;
		userCanConfirm = false;
		nextLevelTransition = false;
		transitionFirstRun = true;
		victoryFirst = true;
	}
}
/* Scrolling Y */
var pace = 0.025;
function pidYScrollUp()
{
	var y = chef.y;
	
	yErr = (canvas.height/3) - y;
	
	yErr *= pace;
	
	refY += yErr;
}

/* Blocks */
function blockedRight(ii)
{
	if(chef.x+64 < blocks[ii].x)
	{
		return false;
	}
	else if(chef.y+64 < blocks[ii].y)
	{
		return false;
	}
	else if(chef.y > blocks[ii].y)
	{
		return false;
	}
	else if(chef.x > blocks[ii].x)
	{
		return false;
	}
	
	return true;
}


Game.update = function()
{
	
	//console.log("Current Platform: " + currentPlatform);
	if(left)
	{
		chef_speed = -5;
		chef.setOrientation("left");
		if(!isJumping && !isFalling)
		{
			chef.setImage("./graphics/chef_left.png");
		}
		
		if(chef.getX()>0)
		{
			chef.x+=chef_speed;
		}
		else
		{
			chef.setX(0);
		}
	}
	if(right)
	{
		chef_speed = 5;
		chef.setOrientation("right");
		if(!isJumping && !isFalling)
		{
			chef.setImage("./graphics/chef.png");
		}
		
		
		//console.log((chef.x+64) + " vs " + canvas.width);
		if((chef.x + chefRefX + 64) < canvas.width) //chef is 64 px wide
		{
			var blocked=false;
			var bi=0;
			for(var ii=0;ii<blocks.length;ii++)
			{
				blocked = blockedRight(ii);
				bi = ii;
				
				if(blocked)
				{
					break;
				}
			}
			if(!blocked)
			{
				chef.x+=chef_speed;
			}
			else
			{
				chef.setX(blocks[bi].x-64);
			}
		}
		else
		{
			chef.setX(canvas.width - chefRefX - 64);
		}
	}
	if(!right && !left)
	{
		chef_speed=0;
	}

	if (isJumping) {
		
		if(chef.getOrientation() == "right")
		{
			chef.setImage("./graphics/chef_right_no_hat.png");
			hat.setImage("./graphics/hat_right.png");
		}
		else
		{
			chef.setImage("./graphics/chef_left_no_hat.png");
			hat.setImage("./graphics/hat_left.png");
		}
		
		if(yVel < 0 || !canChefLand(targetPlatform) || targetPlatform==0)
		{
			whereWillChefJump();
			//console.log("yVel: "+ yVel);
			//console.log("canChefLand: "+ canChefLand(targetPlatform) + " t: " + targetPlatform);
			//console.log("Jumping to: "+ targetPlatform);
		}
		//console.log(landY + " vs " + chef.y);
		
		var yErr = 0;
		if(refY < Math.abs(yMax) && chef.y + refY <= (canvas.height/3) && yVel < 0)
		{
			yErr = ((canvas.height/3) - chef.y) * 0.025;
		}
		else if(refY > 0 && chef.y > (canvas.height/3) && yVel > 0)
		{
			yErr = chef.y - oldChefY;
		}
		
		landY = platforms[targetPlatform].y + (refY + yErr) - 64;
		
		yVel += gravity;
		chef.y += yVel;
		
		hat_yVel += hat_gravity;
		hat.y += hat_yVel;
		
        if (chef.y >= landY) 
		{
            chef.y = landY;
			hat.y = landY;
            yVel = 0;
            isJumping = false;
			landed = true;
        }
    }
	else
	{
		if(!canChefLand(currentPlatform))
		{
			if(chef.getOrientation() == "right")
			{
				chef.setImage("./graphics/chef_right_no_hat.png");
				hat.setImage("./graphics/hat_right.png");
			}
			else
			{
				chef.setImage("./graphics/chef_left_no_hat.png");
				hat.setImage("./graphics/hat_left.png");
			}
			fallIndex = currentPlatform;
			fall();
		}
		if(chef.orient == "right")
		{
			chef.setImage("./graphics/chef.png");
		}
		else
		{
			chef.setImage("./graphics/chef_left.png");
		}
	}
	
	
	if(isFalling)
	{
		
		if(scrollStart==0)
		{
			scrollStart = refY;
		}
		if(currentPlatform>=0)
		{
			if(chef.getOrientation() == "right")
			{
				chef.setImage("./graphics/chef_right_no_hat.png");
				hat.setImage("./graphics/hat_right.png");
			}
			else
			{
				chef.setImage("./graphics/chef_left_no_hat.png");
				hat.setImage("./graphics/hat_left.png");
			}
		
			//console.log("Chef Y = " + chef.y);
			if(!fallTargetLocked)
			{
				whereWillChefFall();
			}
			
			if(!canChefLand(targetPlatform) || targetPlatform == 0)
			{
				fallTargetLocked = false;
			}
			
			yVel += gravity;
			chef.y += yVel;
			
			hat_yVel += hat_gravity;
			hat.y += hat_yVel;
			
			var yErr = 0;
			nextY = chef.y + (yVel + gravity);
			
			//console.log(chef.y);			
			//console.log(nextY);	
			
			if(refY > 0 && (chef.y > (canvas.height/3)))
			{
				yErr = chef.y - oldChefY; //how much scrolling has been done since we just updated chef.y?
				
				//the scrolling problem was caused because this problem is counter-intuitive
				//chef.y > oldChefY always because it is falling and the y coords are reversed
			}
			
			landY = platforms[targetPlatform].y + refY - 64;	
			//landY = platforms[targetPlatform].y + (refY - yErr) - 64;	
			//console.log(landY + " : " + chef.y + " : " + yErr );
			//console.log(chef.y + " vs " + landY);
			
			if (chef.y >= landY || Math.abs(chef.y - landY) <= 1) 
			{
				scrollEnd = refY;
				scrollDiff = scrollStart - scrollEnd;
				scrollStart = 0;
				
				currentPlatform = targetPlatform;
				
				chef.y = platforms[currentPlatform].y - 64 + refY;
				hat.y = chef.y;
				//chef.y = landY;
				//hat.y = landY;
				
				//console.log("landed at " + chef.y);
				
				yVel = 0;
				isFalling = false;
				landed = true;
			}
		}
	}
	
	if(space) //Diagnostics
	{
		//console.log(chef.x);
		//console.log(canvas.width);
		//console.log(scrollDiff);
		//console.log((platforms[targetPlatform].y - 64 + refY));
		//console.log("(" + chef.x + "," + (chef.y-refY) +")");
		//console.log("CY: " + chef.y + " \ PY: " + (platforms[currentPlatform].y - 64 + refY) + " \ CP: " + currentPlatform + " \ RY: " + refY);
	}
	
	for(var ii=0;ii<steaks.length;ii++)
	{
		if(steaks[ii].scorable && steaks[ii].visible)
		{
			hover(steaks[ii],steakMids[ii],5);
		}
		if(chefCollision(steaks[ii]) && steaks[ii].scorable)
		{
			levelscore++;
			score++;
			steaks[ii].scorable = false;
			enRoute.push(ii);
		}
	}
	
	var ei = 0;
	while(ei < enRoute.length)
	{
		//console.log(enRoute[ei]);
		goToGrill(steaks[enRoute[ei]]);
		
		if(onGrill(steaks[enRoute[ei]]))
		{
			//steaks[ei].visible = false;
			var removed = enRoute[ei];
			//console.log("Steak #" + removed + " has been grilled!");
			
			steaks.splice(enRoute[ei],1);
			steakMids.splice(enRoute[ei],1);
			enRoute.splice(ei,1);
			
			for(var ii=0;ii<enRoute.length;ii++)
			{
				if(enRoute[ii] > removed)
				{
					enRoute[ii]--;
				}
			}
			
			ei = -1;
		}
		
		ei++;
	}
	
	/*
	* Scrolling Logic Below
	* Scrolling must be after all motion stuff so that we can use position deltas
	* Variables such as refX do not change physics stuff. Their purpose is to create a scrolling visual effect
	*/
	//if(level>1) 
	//{
		/*Y Scrolls */
		//console.log("REF Y = " + refY + " | CHEF Y = " + chef.y + " | Old Chef Y = " + oldChefY);
		if(refY > 0)
		{
			//scroll if we are falling
			//by creating a flag, landed, we do not need to wait for the next loop to end the fall/jump. This prevents overshoot
			if(chef.y > (canvas.height/3)  && chef.y > oldChefY && !landed)
			{
				//console.log("Scrolling Down");
				refY += oldChefY - chef.y;
				//pidYScrollDown();
			}
		}
		if(refY < Math.abs(yMax))
		{
			if(chef.y + refY <= (canvas.height/3) && chef.y != oldChefY)
			{
				//console.log("Scrolling Up");
				pidYScrollUp();
			}
		}
		
		
		if(refY < 0)
		{
			refY = 0;
		}
		if(refY > Math.abs(yMax))
		{
			refY = Math.abs(yMax);
		}
		
		/* X Scrolls */
		//console.log("ref X = " + refX + " | Chef X = " + chef.x + " | ChefRefX = "+ chefRefX + " | Real Chef X = " + (chef.x + chefRefX));
		if(refX < 0)
		{
			if(chef.x + chefRefX <= (31*canvas.width/64) && oldChefX > chef.x) //Only scroll when just past center and when chef has moved left
			{
				//console.log("Scrolling Left");
				//pidXScrollLeft();
				refX += Math.abs(chef.x - oldChefX);
				chefRefX = refX
			}
		}
	
		if(xMax + refX > canvas.width)
		{
			if(chef.x+chefRefX >= (33*canvas.width/64) && oldChefX < chef.x) //Only scroll when just past center and when chef has moved right
			{
				//console.log("Scrolling Right");
				//pidXScrollRight();
				refX -= Math.abs(chef.x - oldChefX);
				chefRefX = refX;
			}
		}
		
		//X Reference boundaries
		if(refX > 0)
		{
			refX = 0;
			chefRefX=0;
		}
		if(xMax + refX < canvas.width) //xMax always must be > canvas.width
		{
			refX = canvas.width - xMax;
		}
	//}
	
	/*Scrolling Velocity calculations for interpolation*/
	//X Scroll Velocity
	if(refX != oldRefX && refX>0 && refX+xMax < canvas.width)
	{
		refXSpeed = refX - oldRefX;
	}
	else
	{
		refXSpeed = 0;
	}
	
	//Y Scroll Velocity
	if(refY != oldRefY)
	{
		if(refY > 0 && chef.y > canvas.height/3) //Falling Case
		{
			refYSpeed = refY - oldRefY;
		}
		if(refY < Math.abs(yMax) && (chef.y + refY <= (canvas.height/3)) && chef.y!=oldChefY)
		{
			refYSpeed = refY - oldRefY;
		}
	}
	
	hat.x = chef.x;
	oldChefX = chef.x;
	oldChefY = chef.y;
	
	oldRefX = refX;
	oldRefY = refY;
	
	if(levelscore == startSteaks && !isFire)
	{
		fire = 1;
		firstfire = timer.getTimestamp();
		isFire = true;
	}
	
	if(isFire)
	{
		grill.setImage("./graphics/grill-fire-" + fire +".png");
		
		if(fire<3)
		{
			fire++;
		}
		else
		{
			fire=1;
		}
		
		if(chefCollision(grill) && !levelcomplete)
		{
			levelcomplete = true;
			//platforms.push(new Platform(0,100,canvas.width,20));
			//nextLevelTransition = true;
		}
	}
	
	//console.log(levelcomplete);
	if(victoryFirst && levelcomplete)
	{
		userControl = false;
		victoryStart = timer.getTimestamp();
		victoryFirst = false;
	}
	
	if(timer.getTimestamp() - victoryStart > 1000 && levelcomplete)
	{
		nextLevelTransition = true;
	}
	
	if(nextLevelTransition)
	{
		if(transitionFirstRun)
		{
			transitionStart = timer.getTimestamp();
			transitionFirstRun = false;
		}
		userControl = false;
		goToNextLevel();
	}
	
	
}

Game.paint = function(i)
{ 
	if(!nextLevelTransition) //if we are playing
	{
		//Background
		ctx.fillStyle = "#DDF4FF";
		ctx.fillRect(0,0,canvas.width, canvas.height);
		
		
		//THE GROUND IS PLATFORM 0 (for now, I am going to need a different system when blocks comeinto play)
	
		//platforms
		for(var ii=0;ii<platforms.length;ii++)
		{
			console.log(xx);
			
			if(platforms[ii].type == "black")
			{
				ctx.fillStyle = "#000000";
				ctx.fillRect(platforms[ii].getX() + refX  + (refXSpeed * i),platforms[ii].getY() + refY + (refYSpeed * i),platforms[ii].getWidth(), platforms[ii].getHeight());
			}
			else if(platforms[ii].type == "blue_block")
			{
				var xx = platforms[ii].x;
				
				if(xx + 20 + refX < 0)
				{
					while(xx+20+refX<0)
					{
						xx+=20;
					}
				}
				
				while(xx+20+refX <= canvas.width && xx+20 <= platforms[ii].getX() + platforms[ii].getWidth())
				{
					console.log(xx);
					drawer.drawSprite(new Sprite(xx + (refXSpeed * i),platforms[ii].getY() + refY+ (refYSpeed * i),"./graphics/block.png"),xx+refX,platforms[ii].getY() + refY);
					xx+=20;
				}
				
			}
			else if(platforms[ii].type == "ground")
			{
				var xx = platforms[ii].x;
				
				if(xx + 45 + refX < 0)
				{
					while(xx+45+refX<0)
					{
						xx+=45;
					}
				}
				
				while(xx+refX <= canvas.width && xx <= platforms[ii].getX() + platforms[ii].getWidth())
				{
					console.log(xx);
					drawer.drawSprite(new Sprite(xx + (refXSpeed * i),platforms[ii].getY() + refY + (refYSpeed * i),"./graphics/ground.png"),xx+refX,platforms[ii].getY() + refY-9);
					xx+=45;
				}
				
			}
		}
		
		
		
		//console.log(steaks.length);
		
		//steaks
		for(var ii=0;ii<steaks.length;ii++)
		{
			if(steaks[ii].visible = true)
			{
				drawer.drawSprite(steaks[ii],steaks[ii].x + refX + (refXSpeed * i),steaks[ii].y + refY);
			}
		}
		
		ctx.fillStyle = "#000000";
		drawer.drawText("Score: "+score,"18px BM Space", 5,20);
		
		
		if(isJumping || isFalling)
		{
			//hat.draw(ctx);
			drawer.drawSprite(hat, hat.x+chefRefX+ (chef_speed * i), hat.y + (hat_yVel*i));
		}
		//chef.draw(ctx);
		drawer.drawSprite(chef,chef.x + chefRefX + (chef_speed * i), chef.y+(yVel*i));
		
		drawer.drawSprite(grill, grill.x + refX, grill.y + refY);
		
		if(level==0)
		{
			if(!isFire)
			{
				drawer.drawText("Collect the steaks!","18px BM Space", 500,30);
			}
			else if(isFire && !levelcomplete)
			{
				drawer.drawText("Go to the Grill!","18px BM Space", 500,30);
			}
			if(levelcomplete)
			{
				drawer.drawText("Level Complete!!!1!!","30px BM Space", 200,200);
			}
		}
		//lavas
		for(var ii=0;ii<lavas.length;ii++)
		{
			ctx.fillStyle = "#FF0000";
			ctx.fillRect(lavas[ii].getX() + refX,lavas[ii].getY() + refY -9 ,lavas[ii].getWidth(), lavas[ii].getHeight()+9);
			
			/*
			if(lavas[ii].type == "ground_lava")
			{
				var xx = lavas[ii].x;
				
				if(xx + 20 + refX < 0)
				{
					while(xx+20+refX<0)
					{
						xx+=20;
					}
				}
				
				while(xx+20+refX <= canvas.width && xx+36 <= lavas[ii].getX() + lavas[ii].getWidth())
				{
					console.log(xx);
					drawer.drawSprite(new Sprite(xx,lavas[ii].getY() + refY,"./graphics/lava.png"),xx+refX,lavas[ii].getY() + refY);
					xx+=20;
				}
				
			}
			if(lavas[ii].type == "lava")
			{
				var xx = lavas[ii].x;
				
				if(xx + 45 + refX < 0)
				{
					while(xx+45+refX<0)
					{
						xx+=36;
					}
				}
				
				while(xx+45+refX <= canvas.width && xx+45 <= lavas[ii].getX() + lavas[ii].getWidth())
				{
					console.log(xx);
					drawer.drawSprite(new Sprite(xx,lavas[ii].getY() + refY,"./graphics/lava.png"),xx+refX,lavas[ii].getY() + refY);
					xx+=45;
				}
				
			}*/
		}
		
		for(var ii=0;ii<blocks.length;ii++)
		{
			drawer.drawSprite(blocks[ii],blocks[ii].getX()+refX, blocks[ii].getY()+refY);
		}
				
		
		//ctx.fillStyle = "#00FF00";
		//ctx.fillRect(0,0,10,canvas.height/3);
	}
	else //if we are in a transition
	{
		//Background
		ctx.fillStyle = "#000";
		ctx.fillRect(0,0,canvas.width, canvas.height);
		
		ctx.fillStyle = "#FFF";
		drawer.drawText("Transition to the next level","32px Arial", 150,200);
		if(userCanConfirm)
		{
			drawer.drawText("Press Enter to continue","20px Arial", 200,400);
		}
	}
}



/*
Game.pause = function()
{
	clearInterval(Game.intervalId);
	console.log("GAME PAUSED!!");
	
	ctx.font = "30px Arial";
	ctx.fillText("Game Paused!!!1!",10,50);
}
*/

//Keyboard handlers

$(document).keydown(function(event)
{
	//console.log(event.keyCode);
	var key = event.keyCode;
	
	if(userControl) //if the user is allowed to control Chef
	{
		if(key == 32)
		{
			//Spacebar
			
			space=true;
		}
		if(key == 37)
		{
			//left arrow
			
			left=true;
		}
		if(key == 38)
		{
			//up arrow
			//if(!isFalling) //Turn off to do air jumps
			//{
				jump();
			//}
		}
		if(key == 39)
		{
			//right arrow
			right=true;
		}
		if(key == 40)
		{
			//down arrow
			if(!isJumping && !isFalling)
			{
				fallIndex = currentPlatform;
				fall();
			}
		}
	}
	
	if(userCanConfirm) // if the user can end a transition
	{
		if(key == 13) //Enter Key
		{
			userConfirmedTransition = true;
		}
	}
});

$(document).keyup(function(event)
{
	var key = event.keyCode;
	if(key == 32)
	{
		//Spacebar
		space=false;
	}
	if(key == 37)
	{
		//left arrow
		left=false;
	}
	if(key == 38)
	{
		//up arrow
	}
	if(key == 39)
	{
		//right arrow
		right=false;
	}
	if(key == 40)
	{
		//down arrow
		//fallIndex = currentPlatform;
		//fall();
	}
	if(key == 13)
	{
		userConfirmedTransition = false;
	}
});