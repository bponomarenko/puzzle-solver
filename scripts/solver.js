var PuzzleSolver = new (function() {
	var busy;
	var startDate;
	var mapSize;
	var bits;
	var figures;
	var positions;
	var messageCallback;
	var workers = [];
	var workersNum = 0;
	var limit;
	var done;
	var results;

	var solve = function(map, figs, l, callback) {
		if(busy) {
			sendMessage({ type: "message", message: "Cannot run solver - it's busy at the moment"});
		} else {
			startDate = new Date();
			busy = true;
			
			mapSize = { rows: map.r, cols: map.c };
			bits = map.m;
			figures = cloneArray(figs);
			limit = l || 1;
			messageCallback = callback;

			findFiguresPositions();
			reduceFiguresPositions();
			processFigures();
		}
	};

	var processFigures = function() {
		var res = [];
		if(figures.length == 0) {
			throw new Error("No figures specified");
		}
		
		for(var i = figures.length - 1; i >= 0; i--) {
			var key = figures[i].getBits(mapSize.cols).toString();
			var opts = positions[key];
			if(opts.length == 0) {
				throw new Error("One of the figures cannot fit on map!");
			} else if(opts.length == 1) {
				res.push(opts[0].toString());

				bits = bits.or(opts[0]);
				figures.splice(i, 1);
			}
		}

		var key = figures[0].getBits(mapSize.cols).toString();
		
		var f = [];
		for(var i = 1, l = figures.length; i < l; i++) {
			var ff = figures[i];
			f.push({
				r: ff.getSize().rows,
				c: ff.getSize().cols,
				m: ff.getBits().toString()
			});
		}

		var pos = {};
		for(var k in positions) {
			pos[k] = [];
			for(var i = 0, l = positions[k].length; i < l; i++) {
				pos[k].push(positions[k][i].toString());
			}
		}

		var opts = positions[key];
		for(var i = 0, l = opts.length; i < l; i++) {
			var w = new Worker("scripts/solver-thread.js");
			w.addEventListener("message", processMessage);

			var m = bits.or(opts[i]);
			var r = cloneArray(res);
			r.push(opts[i].toString());

			w.postMessage({
				type: "data",
				mapSize: mapSize,
				bits: m.toString(),
				figures: f,
				index: i,
				positions: pos,
				initialResults: r
			});

			workers.push(w);
			workersNum++;
		}

		sendMessage({ type: "message", message: "Starting workers. Workers number: " + workersNum});
		for(var i = 0; i < workersNum; i++) {
			workers[i].postMessage({ type: "solve" });
		}
	};

	var processMessage = function(e) {
		var d = e.data;
		switch(d.type) {
			case "message":
				sendMessage({ type: "message", message: "Worker " + d.workerIndex +" message: " + d.message});
				break;
			case "done":
				if(!done) {
					killWorker(d.workerIndex);
	
					if(workersNum == 0) {
						finish();
					}
				}
				break;
			case "error":
				sendMessage({ type: "message", message: "Worker " + d.workerIndex +" error: " + d.message});
				break;
			case "result":
				if(!done) {
					var checkStr = d.resultFigures.sort().join(",");
					if(results.indexOf(checkStr) == -1) {
						results.push(checkStr);

						sendMessage({ type: "message", message: "Found " + results.length + " result in worker " + d.workerIndex + " for the time " + (new Date() - startDate) / 1000 + "sec"});

						if(results.length >= limit) {
							done = true;
							finish();
						}

						var rf = [];
						for(var i = 0, l = d.resultFigures.length; i < l; i++) {
							rf.push(new BigNumber(d.resultFigures[i]));
						}

						sendMessage({ type: "result", resultFigures: rf });
					}
				}
				break;
		}
	};

	var findFiguresPositions = function() {
		for(var i = 0, l = figures.length; i < l; i++) {

			var f = figures[i];
			var fBits = f.getBits(mapSize.cols);
			var keyStr = fBits.toString();

			if(!positions[keyStr]) {
				var fSize = f.getSize();
				var pos = positions[keyStr] = [];
				
				for(var r = 0, rl = mapSize.rows - fSize.rows + 1; r < rl; r++) {

					for(var c = 0, cl = mapSize.cols - fSize.cols + 1; c < cl; c++) {

						var key = fBits.shiftRight(c).shiftLeft((mapSize.rows - fSize.rows - r) * mapSize.cols);
						if(key.and(bits).isZero()) {
							pos.push(key);
						}
					}
				}

				if(pos.length == 0) {
					throw new Error("One of the figures cannot fit on map!");
				}
			}
		}
	};

	var reduceFiguresPositions = function() {
		var keysNum = 0;
		for(var key in positions) { keysNum += positions[key].length; }
		sendMessage({ type: "message", message: "Number of options: " + keysNum});

		var processedFigures = {};
		var one = new BigNumber("1");
		for(var i = 0, l = figures.length; i < l; i++) {
			var key = figures[i].getBits(mapSize.cols).toString();
			
			if(!(key in processedFigures)) {
				processedFigures[key] = true;

				var figs = cloneArray(figures);
				figs.splice(i, 1);

				var options = positions[key];
				for(var i2 = options.length - 1; i2 >= 0; i2--) {
					var m = bits.or(options[i2]);
					var remove = false;

					for (var r = 0; r < mapSize.rows; r++) {
						if(remove) break;

						for(var c = 0; c < mapSize.cols; c++) {
							if(remove) break;
							var check = one.shiftLeft((mapSize.rows - r - 1)*mapSize.cols + (mapSize.cols - c - 1));
							
							if(m.and(check).isZero()) {
								var processedFigures2 = {};
								var canPut = false;

								for(var j = 0, ll = figs.length; j < ll; j++) {
									if(canPut) break;
									var key2 = figs[j].getBits(mapSize.cols).toString();

									if(!(key2 in processedFigures2)) {
										processedFigures2[key2] = true;

										var options2 = positions[key2];
										for(var j2 = 0, ll2 = options2.length; j2 < ll2; j2++) {

											if(!options2[j2].and(check).isZero() && m.and(options2[j2]).isZero()) {
												canPut = true;
												break;
											}
										}
									}
								}

								if(!canPut) {
									remove = true;
								}
							}
						}
					}	

					if(remove) {
						options.splice(i2, 1);
					}	
				}
			}
		}

		figures.sort(function(f1, f2) {
			var l1 = positions[f1.getBits(mapSize.cols).toString()].length;
			var l2 = positions[f2.getBits(mapSize.cols).toString()].length;
			return l1 - l2;
			// return l2 - l1;
		});

		for(var key in positions) { keysNum -= positions[key].length; }
		sendMessage({ type: "message", message: "Number of removed options: " + keysNum});
	};

	var cloneArray = function(arr) {
		var res = [];
		for(var i = 0, l = arr.length; i < l; i++) {
			res[i] = arr[i];
		}
		return res;
	};

	var reset = function() {
		for(var i = workers.length - 1; i >= 0; i--) {
			killWorker(i);
		}

		workers = [];
		positions = {};
		mapSize = null;
		bits = null;
		startDate = null;
		figures = [];
		busy = false;
		done = false;
		results = [];
	};

	var killWorker = function(index) {
		var worker = workers[index];
		if(worker) {
			worker.terminate();
			workers[index] = undefined;
			workersNum--;
			sendMessage({ type: "message", message: "Worker " + index + " killed. Workers number: " + workersNum});
		}
	};

	var finish = function() {
		sendMessage({ type: "message", message: "DONE! Time: " + (new Date() - startDate) / 1000 + "sec"});

		reset();
		sendMessage({ type: "done" });
	};

	var sendMessage = function(obj) {
		messageCallback(obj);
	};

	this.solve = solve;
	this.reset = reset;
});