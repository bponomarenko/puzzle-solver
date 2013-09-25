(function() {
	var map;
	var figures;
	var field;
	var figureSize = 4;

	var $ = function(id) {
		return document.getElementById(id);
	};

	var init = function() {
		var elems = document.getElementsByTagName("a");
		Array.prototype.forEach.call(elems, function(el) {
			el.addEventListener("click", onLinkClick);
		});

		$("mapSize").addEventListener("change", resetMap);

		reset();
	};

	var resetMap = function() {
		var val = +$("mapSize").value;
		map = new FieldMap($("map"), {rows: val, cols: val}, true, true);
	};

	var onLinkClick = function(e) {
		switch(e.target.id) {
			case "solve":
				solve();
				break;
			case "addField":
				addField();
				break;
			case "reset":
				reset();
				break;
			case "resetFields":
				resetFields();
				break;
		}
	};

	var addField = function () {
		for(var i = 0, l = +$("figuresNum").value; i < l; i++) {
			var obj = field.getBitsObj();
			figures.push(obj);

			printBitsObj($("fields"), obj);
		}
		resetField();
	};

	var printBitsObj = function(container, obj, figures) {
		var d = document.createElement("div");
		var isResult = !!figures;
		var fm = new FieldMap(d, {rows: obj.r, cols: obj.c}, false);
		var one = new BigNumber("1");

		for(var i = 0; i < obj.r; i++) {
			for(var j = 0; j < obj.c; j++) {
				var shift = (obj.r - i - 1) * obj.c + (obj.c - j - 1);

				if (obj.m.shiftRight(shift).and(one).isOne()) {
					fm.setValue(i, j, isResult ? 0 : 1);
				}

				if(isResult) {
					for(var z = 0; z < figures.length; z++) {
						if(figures[z].shiftRight(shift).and(one).isOne()) {
							fm.setValue(i, j, z + 1);
						}
					}
				}
			}
		}

		container.appendChild(d);
	};

	var reset = function() {
		PuzzleSolver.reset();

		$("results").innerHTML = "";
		$("resLimit").value = 1;
		$("mapSize").value = 11;
		$("log").innerHTML = "";

		resetMap();
		resetFields();
	};

	var resetFields = function() {
		figures = [];
		$("fields").innerHTML = "";
		resetField();
	};

	var resetField = function() {
		field = new FieldMap($("field"), {rows: figureSize, cols: figureSize}, true);
		$("figuresNum").value = 1;
	};

	var solve = function() {
		try {
			var f = [];
			for(var i = 0, l = figures.length; i < l; i++) {
				var ff = figures[i];
				f.push(new BitMap().deserialize({
					r: ff.r,
					c: ff.c,
					m: ff.m.toString()
				}));
			}

			PuzzleSolver.solve(
				map.getBitsObj(),
				f,
				+$("resLimit").value,
				onSolverMessage);
		} catch(err) {
			reset();
			log(err, true);
		}
	};

	var onSolverMessage = function(e) {
		switch(e.type) {
			case "done":
				log("--------");
				break;
			case "result":
				printBitsObj($("results"), map.getBitsObj(), e.resultFigures);
				break;
			case "message":
				log(e.message);
				break;
		}
	};

	var log = function(msg, isError) {
		var div = document.createElement("div");
		if(isError) {
			div.style.color = "red";
		}
		div.innerHTML = msg;
		$("log").appendChild(div);
	};

	document.addEventListener("DOMContentLoaded", init);
})();