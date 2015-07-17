(function(){
	// console.log('aaa');

	// var back = document.getElementsByClassName('back')[0];
	// var front = document.getElementsByClassName('front')[0];
	// back.onmouseenter = function(){
	// 	front.style.display = "inline-block";
	// }
	// front.onmouseleave = function(){
	// 	this.style.display = "none";
	// }

	var init = function(){
		render.init();
	};

	var render = {

		init : function(){
			this.initBanner();
		},

		initBanner : function(){
			var wh = window.innerHeight,
				ww = window.innerWidth,
				banner = $('.banner');
			banner.css('height',wh);

			var msg,
				activeNum = 3+Math.round(Math.random()*2);

			for(var i = 0;i<10;i++){
				var x = parseInt(ww*Math.random()),
					y = parseInt(wh*Math.random()),
					red = parseInt(255*Math.random()),
					green = parseInt(255*Math.random()),
					blue = parseInt(255*Math.random()),
					direction = Math.round(Math.random()),
					active = i<activeNum?true:false;
				msg = {
					r : parseInt(10+30*Math.random()),
					R : parseInt(150+400*Math.random()),
					origin : new this.Point(x,y),
					color : "rgb("+red+","+green+","+blue+")",
					active : active,
					direction : direction>0?1:-1,
					angle : parseInt(Math.random()*360),
					step : Math.random()*100/10000
				}
				var ball = new this.Ball(msg);
				$('.background')[0].appendChild(ball.getBall());
				ball.start();
			}

			// msg = {
			// 	r : 60,
			// 	origin : new this.Point(220,200),
			// 	color : "#ba8dac",
			// 	active : true,
			// 	direction : 1,
			// 	angle : 30,
			// 	title : "NAME",
			// 	titleOffsetX : -10,
			// 	titleOffsetY : -20,
			// 	description : ["[ Kimoji ]"],
			// 	descriptionOffsetX : -50,
			// 	descriptionOffsetY : 40,
			// }
			// var ball = new this.Ball(msg);
			// $('svg')[0].appendChild(ball.getBall());
			// msg = {
			// 	r : 110,
			// 	origin : new this.Point(830,480),
			// 	color : "#99a66e",
			// 	active : true,
			// 	direction : 1,
			// 	angle : 240,
			// 	title : "PURPOSE",
			// 	titleOffsetX : -120,
			// 	titleOffsetY : -50,
			// 	description : ["[ a good Front End ","Engineer,","make everyone ","comfortable. ]"],
			// 	descriptionOffsetX : -90,
			// 	descriptionOffsetY : 10,
			// }
			// var ball = new this.Ball(msg);
			// $('svg')[0].appendChild(ball.getBall());
			// msg = {
			// 	r : 70,
			// 	origin : new this.Point(900,130),
			// 	color : "#4c99a1",
			// 	active : true,
			// 	direction : 1,
			// 	angle : 170,
			// 	title : "LOGO",
			// 	titleOffsetX : -10,
			// 	titleOffsetY : 10,
			// 	description : ["[ Kimoji ]"],
			// 	descriptionOffsetX : -10,
			// 	descriptionOffsetY : -20,
			// }
			// var ball = new this.Ball(msg);
			// $('svg')[0].appendChild(ball.getBall());
		},

		Ball : function(o){
			var svgdoc = $('svg')[0].ownerDocument,
				ball = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'g'),
				circle = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'circle'),
				angle = o.angle,
				R = o.R,
				step = o.step,
				direction = o.direction,
				timeHandler,
				that = this,
				gearX,
				gearY;

			this.r = o.r;
			this.x = o.origin.x;
			this.y = o.origin.y;
			this.color = o.color;

			gearX = parseInt(parseInt($('svg').css('width'))*0.45)+75;
			gearY = parseInt(parseInt($('svg').css('height'))*0.3)+75;

			o.active?ball.setAttribute('class','ball active'):ball.setAttribute('class','ball');
			circle.setAttribute('class','circle');

			circle.setAttribute('r',this.r);
			circle.setAttribute('cx',this.x);
			circle.setAttribute('cy',this.y);
			circle.setAttribute('fill',this.color);

			// if(o.active){
			// 	var line = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'line');
			// 	line.setAttribute("x1",gearX);
			// 	line.setAttribute("y1",gearY);
			// 	line.setAttribute("stroke",this.color);
			// 	line.setAttribute("stroke-width",2);
			// 	line.setAttribute("stroke-dasharray","5,5");
			// 	line.setAttribute("stroke-dashoffset","0.00");
			// 	ball.appendChild(line);

			// 	ball.appendChild(circle);
			// 	ball.appendChild(glow);

			// 	var title = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'text');
			// 	title.setAttribute("fill","white");
			// 	title.setAttribute('font-family',"helvetica");
			// 	title.setAttribute('font-size',"30px");
			// 	title.setAttribute("x",this.x+o.titleOffsetX);
			// 	title.setAttribute("y",this.y+o.titleOffsetY);
			// 	title.innerHTML = o.title;
			// 	ball.appendChild(title);

			// 	for(var i = 0;i<o.description.length;i++){
			// 		var description = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'text');
			// 		description.setAttribute("fill","white");
			// 		//description.setAttribute('stroke',"white")
			// 		description.setAttribute('font-family',"helvetica");
			// 		description.setAttribute('font-size',"25px");
			// 		description.setAttribute("x",this.x+o.descriptionOffsetX);
			// 		description.setAttribute("y",this.y+o.descriptionOffsetY+30*i);
			// 		description.innerHTML = o.description[i];
			// 		ball.appendChild(description);
			// 	}
				
			// }
			// else{
			// 	ball.appendChild(circle);
			// 	ball.appendChild(glow);
			// }

			ball.appendChild(circle);

			if(o.active){
				var glow = svgdoc.createElementNS('http://www.w3.org/2000/svg', 'circle');
				glow.setAttribute('class','glow');
				glow.setAttribute('r',this.r);
				glow.setAttribute('cx',this.x);
				glow.setAttribute('cy',this.y);
				glow.setAttribute('fill',"none");
				glow.setAttribute('stroke',this.color);
				ball.appendChild(glow);
			}
			
			function move(){

				angle += step*direction;
				that.x = gearX + Math.round(R * Math.cos(angle/Math.PI));
				that.y = gearY + Math.round(R * Math.sin(angle/Math.PI));

				setBallLocation(that.x,that.y);
			}

			function setBallLocation(x,y){
				circle.setAttribute('cx',x);
				circle.setAttribute('cy',y);
				if(o.active){
					glow.setAttribute('cx',x);
					glow.setAttribute('cy',y);
					// line.setAttribute('x2',x);
					// line.setAttribute('y2',y);
				}
			}

			this.getBall = function(){
				return ball;
			};

			this.start = function(){
				timeHandler = setInterval(move,10);
			};

			this.pause = function(){
				clearInterval(timeHandler);
			};

			this.reset = function(){

			};



			setBallLocation(this.x,this.y);
			

		},

		Point : function(x,y){
			this.x = x;
			this.y = y;
		}




	};

	var bindEvent = {

	};

	var config = {

	};


	//实现一个类似JQuery的选择器，但是只能识别类，id和标签
	$ = function(selector){
		var target;
		switch(selector[0]){
			case '#':
				selector = selector.substring(1);
				target = document.getElementById(selector);
				break;
			case '.':
				selector = selector.substring(1);
				target =  document.getElementsByClassName(selector);
				break;
			default:
				target = document.getElementsByTagName(selector);
				break;
		}
		target.css = function(key,value){
			if(value !== undefined){
				if(target.length !== undefined)
					for(var i = 0;i<target.length;i++)
						target[i].style[key] = value;
				else
					target.style[key] = value;
				return target;
			}
			else{
				if(target.length > 1)
					throw "can not get css value of an elements set";
				else{
					var t = target.length?target[0]:target;
					return window.getComputedStyle(t)[key];
				}
			}
		}




		return target;



	}





	return init();

})()