$(function(){

	DB = {

		db : null,

		config : {
			dbName : 'markdown',
			dbVersion : 2.0,
			table : {
				folder : 'folder',
				file : 'file',
			},
		},

		initDB : function(callback){
			var names = this.db.objectStoreNames,
				times = 0,
				intervalHandler;
			if(names.contains('folder') && names.contains('file')){
				callback();
				return;
			}
			if(!names.contains('folder')){
				var folderReq = this.db.createObjectStore("folder", { keyPath : "fid" ,autoIncrement: true });
			}
			if(!names.contains('file')){
				var store = this.db.createObjectStore("file", { keyPath : "fiid" ,autoIncrement: true });
				store.createIndex('fid', 'fid', { unique: false });
			}
			//轮询
			intervalHandler = setInterval(function(){
				var names = this.db.objectStoreNames;
				if(names.contains('folder') && names.contains('file')){
					clearInterval(intervalHandler);
					initData(callback);
				}
				if(times++>50){
					clearInterval(intervalHandler);
					console.error('db init abort!');
				}
			},100);



			function initData(callback){
				DB.addNewFolder('Notes',function(data){
					if(data.isSuccess){
						var finame = 'Welcome to KimojiMarkdown!',
							content = '# Hello World!',
							fid = 1;
						DB.addNewFile(finame,content,fid,function(data){
							if(data.isSuccess)
								callback();
						})
					}
				});
			}

				
		},

		open : function(callback){
			var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexDB,
				request = indexedDB.open(this.config.dbName,this.config.dbVersion),
				that = this;

			request.onerror = function(e){
		    	console.log("打开DB失败");
			}
			request.onupgradeneeded = function(e){
			    console.log("Upgrading");
			    that.db = e.target.result;
			    that.initDB(callback);
			};

			request.onsuccess = function(e){
				db = e.target.result;
				that.db = db;
				that.initDB(callback);
			};
		},

		//取回所有文件夹
		fetchAllFolder : function(callback){
			var transaction = db.transaction(["folder","file"],"readwrite"),
				objectStore = transaction.objectStore("folder"),
				result = [],
				request = objectStore.openCursor();
			request.onsuccess = function(event) {  
			    var cursor = event.target.result;            
			    if(!cursor){
			    	callback({
			    		isSuccess : true,
			    		result : result,
			    	});
			    	return;
			    }
			    var folder = cursor.value,
			    	fid = folder.fid,
			    	count = 0,
					fileStore = transaction.objectStore("file"),
					range = IDBKeyRange.only(fid),
					req = fileStore.index('fid').openCursor(range,IDBCursor.NEXT_NO_DUPLICATE);
				req.onsuccess = function(event){
					var cur = event.target.result;
					if(!cur){
						folder.count = count;
						result.push(folder); 
		        		cursor.continue(); 
						return ;
					}
					count++;
					cur.continue();
				} 
			};
			request.onerror = function(event){
				callback({
					isSuccess : false,
					message : '连接错误',
				});
			};
		},

		//增加新文件夹
		addNewFolder : function(fname,callback){

			var transaction = db.transaction(["folder"],"readwrite"),
				objectStore = transaction.objectStore("folder");
			objectStore.add({fname : fname});
			transaction.oncomplete = function(event) {
			    var result = {
			    	isSuccess : true,
			    };
			    callback(result);
			};

			transaction.onerror = function(event) {
			   	var result = {
			   		isSuccess : false,
			   		message : '新建文件夹失败',
			   	};
			   	callback(result);
			}; 
		},

		//根据文件夹id删除文件夹
		removeFolderByFid : function(fid,callback){
			var transaction = db.transaction(["folder","file"],"readwrite"),
				objectStore = transaction.objectStore("folder");
			objectStore.delete(fid);
			transaction.oncomplete = function(event) {
			    var result = {
			    	isSuccess : true,
			    };
			    callback(result);
			    var transaction = db.transaction(["file"],"readwrite")
			    	fileStore = transaction.objectStore("file"),
					range = IDBKeyRange.only(fid),
					req = fileStore.index('fid').openCursor(range,IDBCursor.NEXT_NO_DUPLICATE);
				req.onsuccess = function(event){
					var cur = event.target.result;
					if(!cur){
						return ;
					}
					var fiid = cur.value.fiid;
					DB.removeFileByFiid(fiid,function(data){
						if(!data.isSuccess)
							console.error(data.message);
					});
					cur.continue();
				}
			};

			transaction.onerror = function(event) {
			   	var result = {
			   		isSuccess : false,
			   		message : '删除文件夹失败',
			   	};
			   	callback(result);
			};
		},

		//根据文件夹id更新文件夹（更名）
		updateFolderByFid : function(fid,fname,callback){
			var transaction = db.transaction(["folder"],"readwrite"),
				objectStore = transaction.objectStore("folder"),
				request = objectStore.get(fid);
			request.onsuccess = function(event){
				var old = request.result;
				old.fname = fname;
				objectStore.put(old);
				var result = {
					isSuccess : true,
				};
				callback(result);
			}
			request.onerror = function(){
				var result = {
					isSuccess : false,
					message : '更新文件夹信息失败。',
				};
				callback(result);
			}
		},

		//根据文件夹id取回该文件夹下的所有文件
		fetchAllFilesByFid : function(fid,callback){
			var transaction = db.transaction(["file"],"readwrite"),
				objectStore = transaction.objectStore("file"),
				range = IDBKeyRange.only(fid),
				request = objectStore.index('fid').openCursor(range,IDBCursor.NEXT_NO_DUPLICATE),
				result = [];
			
			request.onsuccess = function(event){
				var cursor = event.target.result;
				if(!cursor){
					callback({
						isSuccess : true,
						result : result,
					});
					return;
				}
				result.push(cursor.value);
				cursor.continue();
			};
			request.onerror = function(){
				callback({
					isSuccess : false,
					message : '连接失败',
				})
			};
		},

		//增加新文件
		//finame-文件名，content-文件内容，fid-文件所属文件夹的id
		addNewFile : function(finame,content,fid,callback){
			var transaction = db.transaction(["file"],"readwrite"),
				objectStore = transaction.objectStore("file"),
				file = {
					finame : finame,
					content : content,
					fid : fid,
				};
			objectStore.add(file);
			transaction.oncomplete = function(event) {
				var trans = db.transaction(["file"],"readwrite"),
					objectStore = trans.objectStore("file"),
					range = IDBKeyRange.only(fid),
					request = objectStore.index('fid').openCursor(range,IDBCursor.NEXT_NO_DUPLICATE ),
					max = -1;
				request.onsuccess = function(event){
					var cursor = event.target.result;
					if(!cursor){
						var result = {
					    		isSuccess : true,
					    		fiid : max,
					   		};
					    callback(result);
					    return;
					}
					var fiid = cursor.value.fiid;
					if(fiid > max)
						max = fiid;
					cursor.continue();
				}

				request.onerror = function(){
					console.log('fetch fiid error');
				}
			};

			transaction.onerror = function(event) {
			   	var result = {
			   		isSuccess : false,
			   		message : '新建文件失败',
			   	};
			   	callback(result);
			};
		},

		//根据文件id删除文件
		removeFileByFiid : function(fiid,callback){
			var transaction = db.transaction(["file"],"readwrite"),
				objectStore = transaction.objectStore("file");
			objectStore.delete(fiid);
			transaction.oncomplete = function(event) {
			    var result = {
			    	isSuccess : true,
			    };
			    callback(result);
			};

			transaction.onerror = function(event) {
			   	var result = {
			   		isSuccess : false,
			   		message : '删除文件失败',
			   	};
			   	callback(result);
			};
		},

		//根据文件id更新文件
		updateFileByFiid : function(fiid,finame,content,fid,callback){
			var transaction = db.transaction(["file"],"readwrite"),
				objectStore = transaction.objectStore("file"),
				request = objectStore.get(fiid);
			request.onsuccess = function(event){
				var old = request.result;
				old.finame = finame;
				old.content = content;
				old.fid = fid;
				objectStore.put(old);
				var result = {
					isSuccess : true,
				};
				callback(result);
			};
			request.onerror = function(){
				var result = {
					isSuccess : false,
					message : '更新文件信息失败。',
				};
				callback(result);
			};
		},

		//根据文件id取回文件内容
		fetchFileByFiid : function(fiid,callback){
			var transaction = db.transaction(["file"],"readwrite"),
				objectStore = transaction.objectStore("file"),
				request = objectStore.get(fiid);
			request.onsuccess = function(event){
				var result;
				if(request.result===undefined)
					result = {
						isSuccess : false,
						message : '找不到该文件',
					};
				else
					result = {
						isSuccess : true,
						result : request.result,
					};
				callback(result);
			};
			request.onerror = function(){
				var result = {
					isSuccess : false,
					message : '获取文件信息失败。',
				};
				callback(result);
			};
		},















	};

})