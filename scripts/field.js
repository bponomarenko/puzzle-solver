var FieldMap = function(container, size, isEditable, isInverse) {
	
	var map = [];
	for(var i = 0; i < size.rows; i++) {
		map[i] = [];
		for(var j = 0; j < size.cols; j++) {
			map[i][j] = isInverse ? 1 : 0;
		}
	}

	var cellSize = 20;
	var colors = {};

	var draw = function() {
		var html = "";
		for (var i = 0; i < size.rows; i++) {
			for(var j = 0; j < size.cols; j++) {
				html += "<div class=\"" + getCellClassName(i, j) + "\" data-row=\"" + i + "\" data-col=\"" + j + "\"></div>";
			}
		}
		container.innerHTML = "<div class=\"map\">" + html + "</div>";

		var s = container.firstChild.style;
		s.width = (size.cols * cellSize) + size.cols - 1 + "px";
		s.height = (size.rows * cellSize) + size.rows - 1 + "px";
	};

	var getColor = function(num) {
		if(!colors[num]) {
			// colors[num] = "#" + ("00000"+(Math.random()*(1<<24)|0).toString(16)).slice(-6);
			colors[num] = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
		}
		return colors[num];
	}

	var updateColors = function() {
		var elems = container.getElementsByClassName("cell");
		for(var i = 0, l = elems.length; i < l; i++) {
			updateColor(elems[i]);
		}
	};

	var updateColor = function (cell) {
		var i = +cell.getAttribute("data-row");
		var j = +cell.getAttribute("data-col");
		var isEmpty = map[i][j] == 0;

		if(isInverse) {
			isEmpty = !isEmpty;
		}
		cell.style.backgroundColor = isEmpty ? "" : getColor(map[i][j]);
	};

	var getCellClassName = function(i, j) {
		var className = "cell";
		className += (i == size.rows - 1) ? " nobottomborder" : "";
		className += (j == size.cols - 1) ? " norightborder" : "";
		return className;
	};

	var addEvents = function() {
		var handler = function(e) {
			if(e.which) {
				var el = e.target;
				var i = +el.getAttribute("data-row");
				var j = +el.getAttribute("data-col");

				map[i][j] = map[i][j] == 0 ? 1 : 0;
				updateColor(el);
			}
		};

		var elems = container.getElementsByClassName("cell");
		for(var i = 0, l = elems.length; i < l; i++) {
			var el = elems[i];
			el.addEventListener("mouseover", handler);
			el.addEventListener("mousedown", handler);
		}
	};

	var getBitsObj = function() {
		var m = [];
		var val = isInverse ? 0 : 1;
		var min = size.cols;
		var max = 0;
		var check = parseInt((new Array(size.rows + 1)).join(isInverse ? 1 : 0), 2);

		for(var i = 0; i < size.rows; i++) {
			var a = [];

			for(var j = 0; j < size.cols; j++) {
				a.push(map[i][j]);
				
				if(map[i][j] == val) {
					min = Math.min(min, j);
					max = Math.max(max, j);
				}
			}

			if((parseInt(a.join(""), 2) ^ check) != 0) {
				m.push(a);
			}
		}

		var rows = m.length;
		var cols = size.cols;
		for(var j = size.cols - 1; j >= 0; j--) {
			for(var i = 0; i < rows; i++) {
				if(j < min || j > max) {
					m[i].splice(j, 1);
				}
			}

			if(j < min || j > max) {
				cols--;
			}
		}

		var str = "";
		for(var i = 0; i < rows; i++) {
			str += m[i].join("");
		}

		return {
			r: rows,
			c: cols,
			m: new BigNumber(str)
		}
	};

	var setValue = function(r, c, val) {
		map[r][c] = val;

		var elems = container.getElementsByClassName("cell");
		updateColor(elems[r * size.cols + c]);
	};

	(function() {
		draw();
		updateColors();

		if(isEditable) {
			addEvents();
		}
	})();

	this.getBitsObj = getBitsObj;
	this.setValue = setValue;
};