var BigNumber = function() {
    var _str, _ll, _lh, _hl, _hh;

    var parseStr = function(s) {
        var l = s.length;
        var res = [];
        res.push(parseInt(s.substr(-32, 32), 2));
        res.push(l > 32 ? parseInt(s.substr(-64, Math.min(l - 32, 32)), 2) : 0);
        res.push(l > 64 ? parseInt(s.substr(-96, Math.min(l - 64, 32)), 2) : 0);
        res.push(l > 96 ? parseInt(s.substr(-128, Math.min(l - 96, 32)), 2) : 0);
        return res;
    };

    switch(arguments.length) {
        case 1:
            var r = parseStr(arguments[0]);
            _ll = r[0];
            _lh = r[1];
            _hl = r[2];
            _hh = r[3];
            break;
        case 4:
            _ll = arguments[0];
            _lh = arguments[1];
            _hl = arguments[2];
            _hh = arguments[3];
            break;
    }
    
    var getBits = function(part) {
        switch(part) {
            case 0:
                return _ll;
            case 1:
                return _lh;
            case 2:
                return _hl;
            case 3:
                return _hh;
        }
    };
    
    var pad0 = function(str) {
        return (new Array(32 - str.length + 1)).join("0") + str;
    };

    var getNumStr = function(num, doCheck) {
        return (num == 0 && doCheck) ? "" : pad0((num>>>0).toString(2));
    };
    
    var toString = function() {
        if(_str === undefined) {
            _str = getNumStr(_hh, true);
            _str += getNumStr(_hl, _str.length == 0);
            _str += getNumStr(_lh, _str.length == 0);
            _str += getNumStr(_ll, false);
        }
        return _str;
    };
    
    var and = function(bigNumber) {
        return new BigNumber(
            bigNumber.getBits(0) & _ll,
            bigNumber.getBits(1) & _lh,
            bigNumber.getBits(2) & _hl,
            bigNumber.getBits(3) & _hh
        );
    };

    var or = function(bigNumber) {
        return new BigNumber(
            bigNumber.getBits(0) | _ll,
            bigNumber.getBits(1) | _lh,
            bigNumber.getBits(2) | _hl,
            bigNumber.getBits(3) | _hh
        );
    };

    var shiftRight = function(shift) {
        var s = toString();
        var l = s.length;
        var r = parseStr(s.substr(-l, l - shift));
        return new BigNumber(
            r[0],
            r[1],
            r[2],
            r[3]
        );
    };

    var shiftLeft = function(shift) {
        var s = toString() + (new Array(shift+1)).join("0");
        var r = parseStr(s.substr(-128, 128));
        return new BigNumber(
            r[0],
            r[1],
            r[2],
            r[3]
        );
    };

    var isZero = function() {
        return _hh == 0 && _hl == 0 && _lh == 0 && _ll == 0;
    };

    var isOne = function() {
        return _hh == 0 && _hl == 0 && _lh == 0 && _ll == 1;
    };
    
    this.getBits = getBits;
    this.toString = toString;
    this.and = and;
    this.or = or;
    this.shiftRight = shiftRight;
    this.shiftLeft = shiftLeft;
    this.isZero = isZero;
    this.isOne = isOne;
};
