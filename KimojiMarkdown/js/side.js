$(function(){
	$('.side-bar dd').hide();
	$('.side-bar dt').click(function(){
		//------changcolor
		$('.side-bar dt').css({
			"background":"#367BB4"
		});
		$(this).css({
			"background":"#3471a3"
		});
		$(this).parent().find('dd').removeClass("menu_chioce");
		$(".menu_chioce").slideUp(); 
		$(this).parent().find('dd').slideToggle();
		$(this).parent().find('dd').addClass("menu_chioce");
	});
	$('.open-bar').click(function(){
		$('.side-bar').animate({
			left:0
		},500);
		$('.open-bar').css({
			"display":"none"
		});
	});
	$('.side-bar .slide-arrow').click(function(){
		$('.side-bar').animate({
			left:-120
		},500);
		$('.file-list').animate({
			left:-150
		},500);
		$('.open-bar').css({
			"display":"block"
		});
	});
	$('.selected').click(function(){
		$('.file-list').animate({
			left:120
		},500);
	});
	$('.file-list .slide-arrow').click(function(){
		$('.file-list').animate({
			left:-150
		},1000);
		
	});
})