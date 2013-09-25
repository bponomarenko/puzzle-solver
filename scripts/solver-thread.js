importScripts("bitmap.js");
importScripts("bignumber.js");

var PuzzleSolver = new (function() {
	var mapSize;
	var bits;
	var figures = [];
	var limit;
	var index;
	var figuresCache = [];
	var bitsCache = [];
	var positions = {};
	var resultsCache = [];

	var solve = function() {
		processFigures();
		postMessage({ type: "done" , workerIndex: index });
	};

	var getFigures = function() {
		var l = figuresCache.length;
		return l > 0 ? figuresCache[l - 1] : figures;
	};

	var getBits = function() {
		var l = bitsCache.length;
		return l > 0 ? bitsCache[l - 1] : bits;
	}

	var processFigures = function() {
		var fs = getFigures();
		var processed = {};

		for (var i = 0, l = fs.length; i < l; i++) {

			var f = fs[i];
			var k = f.getBits(mapSize.cols).toString();

			if(!(k in processed)) {
				if(!processFigure(fs[i])) break;

				processed[k] = true;
			}
		}
	};

	var processFigure = function(f) {
		var b = getBits();
		var options = positions[f.getBits(mapSize.cols).toString()];
		var couldBePlaced = false;

		for(var i = 0, l = options.length; i < l; i++) {

			var opt = options[i];
			if(b.and(opt).isZero()) {
				couldBePlaced = true;

				resultsCache.push(opt.toString());

				bitsCache.push(b.or(opt));
				var fs = cloneArray(getFigures());
				fs.splice(fs.indexOf(f), 1);
				figuresCache.push(fs);

				checkResult();
				processFigures();

				bitsCache.pop();
				figuresCache.pop();
				resultsCache.pop();
			}
		}
		return couldBePlaced;
	};

	var cloneArray = function(arr) {
		var res = [];
		for(var i = 0, l = arr.length; i < l; i++) {
			res[i] = arr[i];
		}
		return res;
	};

	var checkResult = function() {
		if(getFigures().length == 0) {
			postMessage({ type: "result", resultFigures: resultsCache, workerIndex: index });
		}
	};

	var processMessage = function(e) {
		var d = e.data;
		switch(d.type) {
			case "data":
				mapSize = d.mapSize;
				bits = new BigNumber(d.bits);
				index = d.index;

				for(var i = 0, l = d.figures.length; i < l; i++) {
					figures.push(new BitMap().deserialize(d.figures[i]));
				}

				for(var k in d.positions) {
					positions[k] = [];
					for(var i = 0, l = d.positions[k].length; i < l; i++) {
						positions[k].push(new BigNumber(d.positions[k][i]));
					}
				}

				resultsCache = d.initialResults;
				break;
			case "solve":
				solve();
				break;
		}
	};

	var msg = function(text) {
		postMessage({ type: "message", message: text, workerIndex: index });
	};

	var error = function(text) {
		postMessage({ type: "error", message: text, workerIndex: index });
	};

	addEventListener("message", processMessage);
});