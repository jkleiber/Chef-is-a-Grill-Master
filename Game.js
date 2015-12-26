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


/* Drawing */
var ctx;
var canvas;
var drawer;
//Scrolling Trickery
var refX = 0;
var refY = 0;

var xMax = 1200;
var yMax = 800;

/* Controls */
var space = false;
var left=false, right=false;

/* Sprites */

//Chef
var chef;
var chef_speed = 5;
var oldChefX, oldChefY;
var chefRefX = 0;

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
var startSteaks = 4;
var steaks;
var steakMids = [];
var enRoute = [];

/* Physics */
var defyPhysics = false; 
var nextPlatformY, nextY;

//Jumps
var yVel = 0;
//var gravity = 1.2; <- original value from tutsplus
var gravity = .7;
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
var level = level || 2;
var platforms,lavas;
var currentPlatform=0, fallIndex=0;

//When the canvas is ready, initialize
$(document).ready(function() {
/* Game Management & Drawing */
isPlaying = true;
canvas = document.getElementById("renderView");
ctx = canvas.getContext("2d");

drawer = new Drawings(ctx); //Be able to draw
stageLoader = new StageLoader(canvas); //Prepare for the stage

goToNextLevel();

$([window, document]).focusin(function(){
      Game.run();
   }).focusout(function(){
      Game.pause();
   });
});

var Game = function(){};


//Physics from tutsplus (http://gamedevelopment.tutsplus.com/tutorials/quick-tip-avoid-game-watch-gravity-in-your-characters-jumps--gamedev-6759)
function jump() {
    if (isJumping == false) {
        yVel = -15;
		hat_yVel = -15;
        isJumping = true;
		jumpTargetLocked = false;
		isFalling = false;
    }
}

function fall()
{
	if (isFalling == false) {
        yVel = -5;
		hat_yVel = -7;
        isFalling = true;
		fallTargetLocked = false;
    }
}

function chefBestAbove()
{
	var highest=0;
	
	for(var ii=0;ii<platforms.length;ii++)
	{
		if((chef.y + 64) <= platforms[ii].y + refY)
		{
			highest = ii;
		}
	}
	
	return highest;
}

function canChefLand(ii)
{
	if((chef.x + 32) >= platforms[ii].x && (chef.x + 32) <= (platforms[ii].x + platforms[ii].w)) //if chef is halfway on, he can land
	{
		return true;
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
			
			landY = platforms[ii].y + refY - 64;
			currentPlatform = ii;
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
	if (chef.y+64<sprite.y)
	{
        return false;
    }
    if (chef.y>sprite.y+sprite.h)
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
	
	xErr = grill.x - x;
	yErr = (grill.y+22) - y; //the grill top is actually 22 pixels below the image origin
	
	xErr *= pace;
	yErr *= pace;
	
	sprite.x += xErr;
	sprite.y += yErr;
}

function onGrill(sprite)
{
	if (grill.y+64<sprite.y)
	{
        return false;
    }
    if (grill.y+22>sprite.y+sprite.h)
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

function goToNextLevel()
{
	//set all flags back to default state
	//clear all platforms, steaks, and enemies from past level.
	//load data for next level, including transition
	//do cool transition, depending on the level
	//begin level
	
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
	
	chefInPos = chefInPosition(0,380);
	if(!chefInPos)
	{
		pidChef(0,380);
	}
	
	levelcomplete = false;
	isFire = false;
	levelscore = 0;
	
	platforms = stageLoader.getPlatforms(level);
	
	steaks = stageLoader.getSteaks(level);
	steakMids = stageLoader.getSteakMids(level);
	for(var ii=0;ii<steaks.length;ii++)
	{
		steaks[ii].setWidth(32);
		steaks[ii].setHeight(32);
		steaks[ii].scorable = true;
	}
	
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
	
	if(currentPlatform == 0 && chefInPos)
	{
		userControl = true;
		nextLevelTransition = false;
	}
}
/* Scrolling Y */

function pidYScrollUp()
{
	var pace = 0.033;
	var y = chef.y;
	
	yErr = (canvas.height/3) - y;
	
	yErr *= pace;
	
	refY += yErr;
}

Game.update = function()
{
	
	//console.log("Current Platform: " + currentPlatform);
	if(left)
	{
		chef.setOrientation("left");
		if(!isJumping && !isFalling)
		{
			chef.setImage("./graphics/chef_left.png");
		}
		
		if(chef.getX()>0)
		{
			chef.setX(chef.getX()-chef_speed);
		}
		else
		{
			chef.setX(0);
		}
	}
	if(right)
	{
		chef.setOrientation("right");
		if(!isJumping && !isFalling)
		{
			chef.setImage("./graphics/chef.png");
		}
		
		
		//console.log((chef.x+64) + " vs " + canvas.width);
		if((chef.x + chefRefX + 64) < canvas.width) //chef is 64 px wide
		{
			chef.setX(chef.getX()+chef_speed);
		}
		else
		{
			chef.setX(canvas.width - chefRefX - 64);
		}
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
		
		whereWillChefJump();
		
		yVel += gravity;
		chef.y += yVel;
		
		hat_yVel += hat_gravity;
		hat.y += hat_yVel;
		
        if (chef.y > landY) 
		{
            chef.y = landY;
			hat.y = landY;
            yVel = 0;
            isJumping = false;
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
			
			if(chef.x != oldChefX)
			{
				fallTargetLocked = false;
			}
			
			yVel += gravity;
			chef.y += yVel;
			
			hat_yVel += hat_gravity;
			hat.y += hat_yVel;
			
			var yErr = 0;
			nextY = chef.y + yVel + gravity;
			
			//console.log(chef.y);			
			//console.log(nextY);	
			
			if(refY > 0 && (chef.y > (canvas.height/3)))
			{
				console.log("true");
				yErr = chef.y - oldChefY; //the scrolling problem was caused because this problem is counter-intuitive
				//chef.y > oldChefY always because it is falling and the y coords are reversed
			}
			
			//nextPlatformY = platforms[targetPlatform].y + (refY - yErr) - 64 + nextY - chef.y;
			
			landY = platforms[targetPlatform].y + (refY - yErr) - 64;	
			console.log(landY + " : " + (refY - yErr) + " : " + yErr );
			
			if (chef.y >= landY || Math.abs(chef.y - landY) <= 1) 
			{
				currentPlatform = targetPlatform;
				chef.y = landY;
				hat.y = landY;
				yVel = 0;
				isFalling = false;
			}
		}
	}
	
	if(space)
	{
		console.log("CY: " + chef.y + " \ PY: " + (platforms[currentPlatform].y - 64 + refY) + " \ CP: " + currentPlatform + " \ RY: " + refY);
	}
	
	for(var ii=0;ii<steaks.length;ii++)
	{
		hover(steaks[ii],steakMids[ii],5);
		
		if(chefCollision(steaks[ii]) && steaks[ii].scorable)
		{
			levelscore++;
			score++;
			steaks[ii].scorable = false;
			enRoute.push(ii);
		}
	}
	
	for(var ii=0;ii<enRoute.length;ii++)
	{
		goToGrill(steaks[enRoute[ii]]);
		
		if(onGrill(steaks[enRoute[ii]]))
		{
			steaks.splice(enRoute[ii],1);
			steakMids.splice(enRoute[ii],1);
			enRoute.splice(ii,1);
		}
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
			if(chef.y > (canvas.height/3)  && chef.y > oldChefY)
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
	
	hat.x = chef.x;
	oldChefX = chef.x;
	oldChefY = chef.y;
	
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
			nextLevelTransition = true;
		}
	}
	
	if(nextLevelTransition)
	{
		userControl = false;
		goToNextLevel();
	}
}

Game.paint = function()
{
	//Background
	ctx.fillStyle = "#DDF4FF";
	ctx.fillRect(0,0,canvas.width, canvas.height);
	
	
	//THE GROUND IS PLATFORM 0

	//platforms
	for(var ii=0;ii<platforms.length;ii++)
	{
		ctx.fillStyle = "#000000";
		ctx.fillRect(platforms[ii].getX() + refX,platforms[ii].getY() + refY ,platforms[ii].getWidth(), platforms[ii].getHeight());
	}
	
	
	
	//console.log(steaks.length);
	
	//steaks
	for(var ii=0;ii<steaks.length;ii++)
	{
		drawer.drawSprite(steaks[ii],steaks[ii].x,steaks[ii].y);
	}
	
	ctx.fillStyle = "#000000";
	drawer.drawText("Score: "+score,"20px Arial", 5,20);
	
	
	if(isJumping || isFalling)
	{
		//hat.draw(ctx);
		drawer.drawSprite(hat, hat.x+chefRefX, hat.y);
	}
	//chef.draw(ctx);
	drawer.drawSprite(chef,chef.x + chefRefX ,chef.y);
	
	drawer.drawSprite(grill, grill.x + refX, grill.y + refY);
	
	if(!isFire)
	{
		drawer.drawText("Collect the steaks!","30px Arial", 500,30);
	}
	else if(isFire && !levelcomplete)
	{
		drawer.drawText("Go to the Grill!","30px Arial", 500,30);
	}
	if(levelcomplete)
	{
		drawer.drawText("Level Complete!!!1!!","64px Arial", 200,200);
	}
	
	//lavas
	for(var ii=0;ii<lavas.length;ii++)
	{
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(lavas[ii].getX() + refX,lavas[ii].getY() + refY ,lavas[ii].getWidth(), lavas[ii].getHeight());
	}
	
	
	ctx.fillStyle = "#00FF00";
	ctx.fillRect(0,0,10,canvas.height/2);
}

Game.fps = 50;

/* Fixed Time Step Rendering */
Game.run = (function() {
	var loops = 0, skipTicks = 1000 / Game.fps,
		maxFrameSkip = 10,
		nextGameTick = timer.getTimestamp();
  
	return function() {
		loops = 0;
		
		while (timer.getTimestamp() > nextGameTick && loops < maxFrameSkip) {
			Game.update();
			nextGameTick += skipTicks;
			loops++;
		}
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		Game.paint();
	};
})();

// Start the game loop
Game._intervalId = setInterval(Game.run, 0);



/* Optimal Refresh Rate  Thing 
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
*/


Game.pause = function()
{
	clearInterval(Game.intervalId);
	console.log("GAME PAUSED!!");
	
	ctx.font = "30px Arial";
	ctx.fillText("Game Paused!!!1!",10,50);
}


//Keyboard handlers

$(document).keydown(function(event)
{
	//console.log(event.keyCode);
	var key = event.keyCode;
	if(userControl)
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
});