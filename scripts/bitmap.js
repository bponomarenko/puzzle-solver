var BitMap = function(rows, cols) {
	var getMask = function (row, col, val) {
		return new BigNumber(new Array(row * col + 1).join(val));
	};
	
	var bitmap = rows && cols ? getMask(rows, cols, 0) : null;
	var key;

	var getBits = function(c) {
		if(c && c > cols) {
			if(!key) {
				key = new BigNumber("0");
				var mask = getMask(1, cols, 1);
				var shift = c - cols;
				
				for(var i = 0; i < rows; i++) {
					key = key.or(bitmap.shiftRight(getShift(i, cols - 1)).and(mask).shiftLeft(shift + ((rows - i - 1) * c)));
				}
			}
			return key;
		} else {
			return bitmap;
		}
	};

	var inverse = function(row, col) {
		bitmap = bitmap.or((new BigNumber("1")).shiftLeft(getShift(row, col)));
		key = null;
	};
	
	
	var deserialize = function(obj) {
		if(obj) {
			rows = obj.r;
			cols = obj.c;
			bitmap = new BigNumber(obj.m);
		}
		return this;
	};
	
	var getSize = function() {
		return { rows: rows, cols: cols };
	};
	
	var getShift = function(row, col) {
		return ((rows - row - 1) * cols) + cols - col - 1;
	};

	this.getBits = getBits;
	this.inverseBit = inverse;
	this.deserialize = deserialize;
	this.getSize = getSize;
	this.getShift = getShift;
};