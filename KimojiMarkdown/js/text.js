$(function(){
	var init = function(){
		asyn.init();
		bindEvent.init();
		config.init();
		render.init();
		ctrl.init();
		//exposure interface
		Render = render;

	},

	asyn = {
		init : function(){
			var that = this;
			DB.open(function(){
				that.fillFolderWrap();
			});
		},

		fillFolderWrap : function(){
			DB.fetchAllFolder(function(data){
				//console.log(data);
				if(data.isSuccess){
					render.fillFolderWrap(data.result);
				}
				else{
					//console.log(data.message);
				}
			});
		},

		fillFileWrap : function(fid){
			DB.fetchAllFilesByFid(fid,function(data){
				//console.log(data);
				if(data.isSuccess){
					render.fillFileWrap(fid,data.result);
				}
				else{
					//console.log(data.message);
				}
			});
		},

		fetchFileByFiid : function(fiid){
			DB.fetchFileByFiid(fiid,function(){
				//console.log(data);
				if(data.isSuccess){
					render.fillTextareaWrap(data.result);
					render.renderMarkdown();
					render.togglePanel('.render-area',true);
				}
				else{
					//console.log(data.message);
				}
			});
		},

		addNewFolder : function(fname){
			DB.addNewFolder(fname,function(data){
				if(data.isSuccess){
					asyn.fillFolderWrap();
				}
				else{
					alert(data.message);
				}
			})
		},

		addNewFile : function(finame,content,fid,callback){
			DB.addNewFile(finame,content,fid,callback);
			ctrl.callback.updateFolderAfterNewFile(fid,true);
		},

		updateFileByFiid : function(fiid,finame,content,fid,callback){
			DB.updateFileByFiid(fiid,finame,content,fid,callback);
		},

		removeFolderByFid : function(fid,callback){
			DB.removeFolderByFid(fid,callback);
		},

		removeFileByFiid : function(fiid,callback){
			DB.removeFileByFiid(fiid,callback);
			var fid = $('.file-wrap').data('fid');
			ctrl.callback.updateFolderAfterNewFile(fid,false);
		},


	},

	render = {

		init : function(){
			this.initEditor();
		},

		factory : {

			folderItem : function(data){
				var item = $('<dl><dt>'+
						  			'<a href="javascript:void(0);" class="delete-btn">删除</a>'+
						  			'<div class="content-wrap"><span class="folder-name"></span><span class="count"></span></div>'+
						  		'</dt></dl>');
				item.find('.folder-name').html(data.fname);
				item.find('.count').html(data.count);
				item.data('externalMsg',data);
				return item;
			},

			fileItem : function(data){
				var item = $('<div class="file-item">'+
								'<a href="javascript:void(0);" class="delete-btn">删除</a>'+
								'<div class="content-wrap">'+
									'<div class="header"></div>'+
									'<div class="digest"></div>'+
								'</div>'+
							'</div>');
				item.find('.header').html(data.finame);
				item.find('.digest').html(data.content);
				item.data('externalMsg',data);
				return item;
			},

		},

		fillFolderWrap : function(data){
			var wrap = $('.folder-wrap .content').empty();
			for(var i = 0;i<data.length;i++){
				var item = this.factory.folderItem(data[i]);
				wrap.append(item);
			}
		},

		fillFileWrap : function(fid,data){
			var wrap = $('.file-wrap .content').empty();
			for(var i = 0;i<data.length;i++){
				var item = this.factory.fileItem(data[i]);
				wrap.append(item);
			}
			$('.file-wrap').data('fid',fid);
		},

		initEditor : function(){
			var wh = window.innerHeight,
				wrap = $('.site-wrap');
			this.togglePanel('folder-wrap',false);
			this.togglePanel('file-wrap',false);
			this.togglePanel('textarea-wrap',true);
			this.togglePanel('render-area',true);
		},

		togglePanel : function(panelName,isVisible){
			var ww = window.innerWidth,
				ratio,
				panel = $('.site-wrap .' + panelName),
				currentState = panel.is('.folded');

			//if the panel has been visible/invisible,return
			// if((currentState && !isVisible) || (!currentState && isVisible))
			// 	return;

			isVisible?panel.removeClass('folded'):panel.addClass('folded');
			this.fixedPanelWidth();

			if(panelName === 'folder-wrap' || panelName === 'file-wrap'){
				ratio = isVisible?0.2:0.05;
			}
			else
				ratio = isVisible?0.4:0.05;
			panel.css('width',ww*ratio);
		},

		fixedPanelWidth : function(){
			var w = ctrl.getW(),
				wrap = $('.site-wrap');
			if(w<8){
				//small
				wrap.css('width','100%');
			}
			else if(w < 10){
				//medium
				wrap.css('width','110%');
			}
			else{
				//large
				wrap.css('width','130%');
			}
		},


		fillEditPanelAndRenderArea : function(text){
			//fill the panel
			$('#edit-area').val(text);
			this.renderMarkdown();

			//show the render-panel at least,the user want to checkout the document at most time
			this.togglePanel('render-area',true);
		},

		renderMarkdown : function(){
			$('#markdown').html(config.md.render($('#edit-area').val()));
		},

		fillTextareaWrap : function(data){
			//console.log(data);
			var wrap = $('.textarea-wrap');
			wrap.find('input[name="title"]').val(data.finame);
			$('#edit-area').val(data.content);
			wrap.data('externalMsg',data);
		},

		clearTextareaWrap : function(){
			var panel = $('.textarea-wrap');
			panel.find('input[name="title"]').val('');
			$('#edit-area').val('');
		},

		clearRenderArea : function(){
			$('#markdown').html('');
		},

		clearFileWrap : function(){
			$('.file-wrap .content').empty();
		},

	},

	bindEvent = {
		init : function(){
			this.operationsWrap();
			this.togglePanel();
			this.folderPanel();
			this.filePanel();
			this.fileItemDelete();
			this.folderItemDelete();
		},

		fileItemDelete : function(){
			var isMouseDown = false,
				originX,
				item,
				direction,
				offset = config.file_delete_offset;
			$(document).on('mousedown','.file-item',function(e){

				var that = $(this);

				//复位其他file-item的删除
				that.siblings().each(function(){
					var that = $(this),
						slide = that.find('.content-wrap'),
						left = slide.position().left;
					if(left<0){
						slide.animate({'left':0});
					}
				});

				//防止单纯点击因为页面滚动出现删除按钮，但是如果是删除操作则这是一个错误的阻止
				if($('.render-area').is('.folded'))
					return false;

				isMouseDown = true;
				originX = e.offsetX;
				item = that.find('.content-wrap');
				////console.log(item);
			});

			$(document).on('mousemove',function(e){
				if(!isMouseDown)
					return false;
				var offsetX = item.position().left,
					dx = e.offsetX - originX,//鼠标移动偏移值
					left = offsetX + dx;
				direction = dx>0?1:-1;
				if(left>0)
					left = 0;
				if(left<-offset)
					left = -offset;
				////console.log(left);
				item.css('left',left);
			});

			$(document).on('mouseup',function(){
				isMouseDown = false;
				if(item === undefined)
					return false;
				if(direction === 1){
					item.animate({'left':0});
				}
				else{
					item.animate({'left':-offset});
				}
			})
		},

		folderItemDelete : function(){
			var isMouseDown = false,
				originX,
				item,
				direction,
				offset = config.folder_delete_offset;
			$(document).on('mousedown','.folder-wrap dl',function(e){

				var that = $(this);

				//复位其他folder-item的删除
				that.siblings().each(function(){
					var that = $(this),
						slide = that.find('.content-wrap'),
						left = slide.position().left;
					if(left<0){
						slide.animate({'left':0});
					}
				});

				//防止单纯点击因为页面滚动出现删除按钮，但是如果是删除操作则这是一个错误的阻止
				if($('.file-wrap').is('.folded'))
					return false;

				isMouseDown = true;
				originX = e.offsetX;
				item = that.find('.content-wrap');
				////console.log(item);
			});

			$(document).on('mousemove',function(e){
				if(!isMouseDown)
					return false;
				var offsetX = item.position().left,
					dx = e.offsetX - originX,//鼠标移动偏移值
					left = offsetX + dx;
				direction = dx>0?1:-1;
				if(left>0)
					left = 0;
				if(left<-offset)
					left = -offset;
				////console.log(left);
				item.css('left',left);
			});

			$(document).on('mouseup',function(){
				isMouseDown = false;
				if(item === undefined)
					return false;
				if(direction === 1){
					item.animate({'left':0});
				}
				else{
					item.animate({'left':-offset});
				}
			})
		},

		preventSelected : function(){
			$(document).on('selectstart','.folder-wrap',function(){
				return false;
			});

			$(document).on('selectstart','.file-wrap',function(){
				return false;
			});
		},

		folderPanel : function(){
			// $(document).on('click','.folder-wrap dt',function(){
			// 	var dt = $(this),
			// 		parent = dt.parent();
			// 	if(parent.is('active'))
			// 		return false;
			// 	parent.addClass('active').siblings().each(function(){
			// 		var that = $(this);
			// 		that.removeClass('active').find('dd').slideUp();
			// 	})
			// 	parent.find('dd').slideDown();
			// });

			$(document).on('click','.folder-wrap dl',function(e){
				var that = $(this),
					fid = that.data('externalMsg').fid,
					target = $(e.target);
				if(target.is('.delete-btn')){
					return;
				}

				that.addClass('active').siblings().removeClass('active');
				asyn.fillFileWrap(fid);
				ctrl.enableNewFileBtn(true);
				render.togglePanel('file-wrap',true);
			});

			$(document).on('click','.folder-wrap .new-folder-btn',function(){
				var name = prompt('请输入新文件夹的名称：');
				while(name !== null && name.replace(/\s/g,'') === ''){
					alert('文件名不合法！')
					name = prompt('请输入新文件夹的名称：');
				}
				if(name === null)
					return false;
				asyn.addNewFolder(name);
			});

			$(document).on('click','.folder-wrap .delete-btn',function(){
				var that = $(this).parents('dl'),
					data = that.data('externalMsg'),
					count = data.count,
					fid = data.fid;
				if(count > 0){
					if(!confirm('该文件夹不为空，确定删除？')){
						return false;
					}
				}
				asyn.removeFolderByFid(fid,function(data){
					if(data.isSuccess){
						asyn.fillFolderWrap();
						render.clearFileWrap();
						render.clearTextareaWrap();
						render.clearRenderArea();
					}
					else{
						console.erorr(data.message);
					}
				});
			});
	
		},

		filePanel : function(){

			$(document).on('click','.file-item',function(e){
				// var that = $(this),
				// 	fiid = that.data('externalMsg').fiid;
				// asyn.fetchFileByFiid(fiid);
				var that = $(this),
					data = $(this).data('externalMsg'),
					target = $(e.target);
				if(target.is('.delete-btn')){
					render.clearTextareaWrap();
					render.clearRenderArea();
					return;
				}

				//the first time to click the file-item
				if($('file-item.active').length !== 0 && !that.is('.active'))
					return false;

				//the flowing two sentences can not be exchange 
				ctrl.saveFile();
				that.addClass('active').siblings().removeClass('active');

				render.fillTextareaWrap(data);
				render.renderMarkdown();
				ctrl.enableTextArea(true);
				render.togglePanel('render-area',true);
			});

			$(document).on('click','.new-file-btn',function(){
				var that = $(this);
				if(that.attr('disabled') === 'disabled')
					return false;
				ctrl.enableTextArea(true);
				ctrl.saveFile();
			});

			$(document).on('click','.file-item .delete-btn',function(){
				var that = $(this).parents('.file-item'),
					fiid = that.data('externalMsg').fiid;
				asyn.removeFileByFiid(fiid,function(data){
					if(data.isSuccess){
						that.remove();
					}
					else{
						console.error(data.message);
					}
				})
			});

		},

		operationsWrap : function(){
			var editArea = $('#edit-area'),
				textBreakInterval,
				displayArea = $('#markdown');

			// function textBreak(){
			// 	displayArea.html(config.md.render(editArea.val()));
			// }

			$(document).on('click','.auto-render-btn',function(){
				var that = $(this);
				if(that.is('.active')){
					that.removeClass('active');
					//unbind auto render
					editArea.unbind('keyup');
				}
				else{
					that.addClass('active');

					render.renderMarkdown();
					render.togglePanel('render-area',true);

					//auto render the document
					editArea.keyup(function(){
						clearTimeout(textBreakInterval);
						textBreakInterval = setTimeout(render.renderMarkdown,500);
					});
				}
			});

			$(document).on('click','.render-btn',function(){
				render.renderMarkdown();
				render.togglePanel('render-area',true);
			});

			$(document).on('click','.save-btn',function(){
				ctrl.saveFile();
			})
		},

		togglePanel : function(){
			$(document).on('click','.toggle-panel-btn',function(){
				var panel = $(this).parents('.panel'),
					name = panel.attr('name'),
					isVisible;
				if(panel.is('.folded')){
					panel.removeClass('folded');
					isVisible = true;
				}
				else{
					panel.addClass('folded');
					isVisible = false;
				}
				render.togglePanel(name,isVisible);
			});

			$(document).on('click','.panel .close',function(){
				var panel = $(this).parents('.panel'),
					name = panel.attr('name');
					panel.addClass('folded');
					render.togglePanel(name,false);
			});
		},





	},

	ctrl = {

		init : function(){
			//在未选文件夹和文件之前禁用编辑面板
			this.enableTextArea(false);

			//初始化数据
			$('.textarea-wrap').data('externalMsg',{});
		},

		callback : {
			//在增加文件后在UI上更新对应文件夹下文件数目
			updateFolderAfterNewFile : function(fid,add){
				var folders = $('.folder-wrap dl');
				for(var i  = 0,length = folders.length;i<length;i++){
					var folder = folders.eq(i),
						data = folder.data('externalMsg');
					if(data.fid === fid){
						add?data.count++:data.count--;
						folder.data('externalMsg',data);
						folder.find('.count').html(data.count);
						return;
					}
				}
			},
		},

		enableNewFileBtn : function(enable){
			var btn = $('.file-wrap .new-file-btn'),
				disabled = enable?false:'disabled';
			btn.attr('disabled',disabled);
		},

		enableTextArea : function(enable){
			var mask = $('.textarea-wrap .mask');
			enable?mask.fadeOut():mask.fadeIn();
		},

		getW : function(){
			var wraps = $('.site-wrap>div:not(.folded)'),
				w = 0;
			for(var i = 0;i<wraps.length;i++)
				w += wraps.eq(i).index()+1;
			return w;
		},

		saveFile : function(){
			var panel = $('.textarea-wrap'),
				title = panel.find('input[name="title"]').val(),
				content = $('#edit-area').val(),
				data = panel.data('externalMsg');
			//防止用户不断点击新建文件按钮
			if(title === '' && content === '' && data.fiid === undefined)
				return false;
			var item = $('.file-item.active'),
				fid = data.fid;
			if(data.fiid === undefined){
				var folderId = $('.file-wrap').data('fid');
				//new
				asyn.addNewFile(title,content,folderId,function(data){
					//console.log(data);
					if(data.isSuccess){
						//var newItem = render.factory.fileItem(title,content)
						var fid = $('.file-wrap').data('fid'),
							fiid = data.fiid;
						panel.data('externalMsg',{
							fid : fid,
							fiid : fiid,
						});
						asyn.fillFileWrap(folderId);
					}
					else{
						//console.error(data.message);
					}
				});
			}
			else{
				//update
				//保存数据在本地缓存中
				var newData = {
					finame : title,
					content : content,
					fid : fid,
					fiid : data.fiid,
				};
				//console.log(item);
				item.data('externalMsg',newData);
				//更新item的UI展示
				item.find('.header').html(title);
				item.find('.digest').html(content);
				//清空编辑区
				render.clearTextareaWrap();
				//保存所属文件夹id
				panel.data('externalMsg',{fid:fid});
				//保存新数据到数据库
				asyn.updateFileByFiid(data.fiid,title,content,fid,function(data){
					if(data.isSuccess){
						//console.log('数据更新成功');
					}
					else{
						//console.log(data.message);
					}
				});
			}

			
		},


	},

	config = {

		togglePanelAnimateSpeed : 500,

		folder_delete_offset : 40,

		file_delete_offset : 60,

		md : null,

		init : function(){

			//var Remarkable = require('remarkable');
			//var hljs       = require('highlight.js') // https://highlightjs.org/

			this.md = new Remarkable('full', {
			  html:         false,        // Enable HTML tags in source
			  xhtmlOut:     false,        // Use '/' to close single tags (<br />)
			  breaks:       false,        // Convert '\n' in paragraphs into <br>
			  langPrefix:   'language-',  // CSS language prefix for fenced blocks
			  linkify:      true,         // autoconvert URL-like texts to links

			  // Enable some language-neutral replacements + quotes beautification
			  typographer:  false,

			  // Double + single quotes replacement pairs, when typographer enabled,
			  // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
			  quotes: '“”‘’',

			  // Highlighter function. Should return escaped HTML,
			  // or '' if input not changed
			  highlight: function (str, lang) {
			    if (lang && hljs.getLanguage(lang)) {
			      try {
			        return hljs.highlight(lang, str).value;
			      } catch (__) {}
			    }

			    try {
			      return hljs.highlightAuto(str).value;
			    } catch (__) {}

			    return ''; // use external default escaping
			  }
			});
		},




	};

	init();

});