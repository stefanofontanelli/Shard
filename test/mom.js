var Class = (function () {

	var initializing = false, fnTest = (new RegExp("xyz")).test(function () {xyz;}) ? new RegExp("\\b_super\\b") : new RegExp(".*");
	
	function Ctor () {}
	Ctor.prototype.instanceOf = function (klass) {
	  return this instanceof klass.ctor;
	};
	
	var Class = {
	  init: function () {
	    initializing = true;
	    var ret = new this.ctor();
	    initializing = false;
	    this.ctor.apply(ret, arguments);
	    return ret;
	  },
	  ctor: Ctor,
	  proto: function () {
	    var prototype = this.ctor.prototype
	      , extensions, k, v
	      , self = this
	      , _super = this.superclass && this.superclass.ctor.prototype;
	    for (var i = 0, l = arguments.length; i < l; i++) {
	      extensions = arguments[i];
	      for (k in extensions) if (extensions.hasOwnProperty(k)) {
	        v = extensions[k];
	        prototype[k] = (typeof v === "function" && _super && typeof _super[k] === "function" && fnTest.test(v)) // If this function has a call to this._super
	          ? // Give super access to the properties that are functions,
	            // IF those functions have a call to this._super
	            (function (name, fn) {
	              // Give the function super access to the key values that are functions, if those
	              // functions have a call to this._super.
	              return function () {
	                var tmp = this._super, ret;
	                this._super = _super[name];
	                ret = fn.apply(this, arguments);
	                this._super = tmp;
	                return ret;
	              };
	            })(k, v)
	          : v; // else
	      }
	    }
	  },
	  subclass: function (methods) {
	    function E () {}
	    E.prototype = this;
	    var subclass = new E ();
	    function F () {
	      if (!initializing && this.init) {
	        this.init.apply(this, arguments);
	      }
	    }
	    initializing = true;
	    F.prototype = new this.ctor();
	    initializing = false;
	    subclass.ctor = F;
	    F.prototype.klass = subclass;
	    F.prototype.superclass = this;
	    subclass.superclass = this;
	    subclass.proto(methods);
	    return subclass;
	  }
	};
	
	return Class;
	
})(this);
//module.exports = Class;

var redis = {};
		
module.exports = Class.subclass({
	
	redis: redis,
	
	init: function (shards, options) {
		
		this.epoch = opt.epoch || 1323763260000; // 2011-12-13T00:01:00Z
	},
	
	zeroFill: function (n,z) {
		var l = z || this.zeros,
			r = n.toString(),
			d = l-r.length;
		for (var j=0;j<d;j++) r = "0"+r;
		return r;	
	},
	
	clientInit: function (sn) {
		if (!this.client[sn]) {
			var shard = this.shards[sn],
				rc = this.client[sn] = redis.createClient(shard[0],shard[1]);
			rc.on('error', function (err) {
			    console.log('Error on '+ sn + ': ' + err);
			});
		}
		return this.client[sn];
	},
	
	initializeSequences: function () {
		var self = this;
		for (var j=0;j<this.nodes;j++) {
			var s = this.zeroFill(j),
				rc = this.clientInit(s);
			rc.get(this.seqname,function (err,val) {
				if (!val) self.setupSequences();
			});
			return;
		}
	},
	
	setupSequences: function () {
		for (var j=0;j<this.nodes;j++) {
			var s = this.zeroFill(j);
			var rc = this.clientInit(s);
			rc.set(this.seqname,1);
		}
	},
	
	isBase62: function (s) {
		var re = new RegExp("[^"+this.base62keystr+"]");
		if (!s || re.test(s)) return false;
		return true;
	},
	
	toBase62: function (x) {
		if (!x) return "0";
		var ret = "";
		while (x > 0) {
			var p = x % 62;
			ret = this.base62keystr.substring(p,p+1) + ret;
			x = Math.floor(x/62);
		}
		return ret;
	},
	
	fromBase62: function (x) {
		if (!x) return 0;
		var ret = 0;
		for (var j = x.length; j; j--) {
			var p = -1 * (j - x.length);
			ret += this.base62keystr.indexOf(x.substring(p,p+1)) * Math.pow(62,j-1);
		}
		return ret;
	},
	
	nullfunc: function (){},

	genKey: function (cb) {
		var self = this,
			callback = cb || this.nullfunc,
			m = (new Date()).getTime() - this.epoch,
			s = m % this.nodes;
		var rc = this.clientInit(this.zeroFill(s));
		rc.get(this.seqname,function (err, val) {
			rc.incr(self.seqname);
			var k = self.toBase62((m * 100) + (val % 100)) + ":" + self.toBase62(s);
			callback(k);
		});
	},
	
	firstShard: function () {
		for (var j=0;j<this.nodes;j++)
			return this.zeroFill(j);
	},
	
	whereIs: function (key) {
	    var k = key.split(":");
	    if (!this.isBase62(k[1])) return this.firstShard();
	    var s = this.zeroFill(this.fromBase62(k[1]));
	    if (!this.shards[s]) return this.firstShard();
	    return s;
	},
	
	getClient: function (key) {
		return this.clientInit(this.whereIs(key));
	}
	
});

