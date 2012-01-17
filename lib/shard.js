/*!
 * Shard-js version 0.1.6
 * January 12, 2011
 * (c) Francesco Sullo, sullof@sullof.com
 * Released under MIT Licence
 *
 * Shard-js manages re-shardable databases with up to 4096 shards.
 * 
 * Install:
 * 
 *     npm install shard
 * 
 */

var Class = require('class-js');
		
module.exports = Class.subclass({
	
	// the native db client:
	native: null,
	
	_keystr: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	_strlen: 62,
	_variants: 62*62,
	_zeros: 2,
	
	_client: [],

	// we wanna use the $ to start keys with the same name around the sharding
	_seqname: '$equence',
	
	// 2011-12-13T00:01:00Z
	_epoch: 1323763260000,
	
	keyTypes: {},
	specialKeys: {},
	
	init: function (config) {
		var shards = config.shards,
			opt = config.options || {};
			
		if (opt.epoch && opt.epoch < Date.now()) this._epoch = opt.epoch;
		if (opt.seqname) this._seqname = opt.seqname;

		this.shards = shards;
		this.size = 0;
		for (var j in this.shards) this.size++;
		
		// set special keys (indexes, etc.)
		if (opt.keyTypes) {
			for (j in opt.keyTypes)
				if (!this.addKeyType(j,opt.keyTypes[j]))
					console.log("Error creating keytype "+j);
			var specialKeys = opt.specialKeys || {};
			for (j in specialKeys)
				if (!this.addSpecialKey(j,specialKeys[j]))
					console.log("Error creating special key "+j);
		}
//		console.log(JSON.stringify(this.keyTypes));
//		console.log(JSON.stringify(this.specialKeys));
	},
	
	addKeyType: function (key,val) {
		/*
		 * return:
		 * 1 ok
		 * -1 already exists
		 * 0 error 
		 */
		for (var j in this.keyTypes)
			if (j == key) return -1;
			else if (this.keyTypes[j] == val) return 0;
		this.keyTypes[key] = val;
		return 1;
	},

	addSpecialKey: function (key,val) {
		/*
		 * return:
		 * 1 ok
		 * -1 already exists
		 * 0 error 
		 */
		for (var j in this.specialKeys)
			if (j == key) return -1;
		var kt = this.keyTypes[val[2]];
		if (typeof kt !== 'number') return 0;
		this.specialKeys[key] = this.fixedKey(kt,val[0],val[1]);
		return 1;
	},
	
	zeroFill: function (n,z) {
		var l = z || this._zeros,
			r = n.toString(),
			d = l-r.length;
		for (var j=0;j<d;j++) r = "0"+r;
		return r;	
	},
	
	_clientInit: function (s) {
//		console.log(s);
		var sn = s.toString();
//		console.log(sn);
		if (!this._client[sn]) {
			var shard = this.shards[sn];
			if (!shard) {
				console.log("Error asking for shard #"+s);
				return null;
			}
			this._client[sn] = this._createClient(sn,shard[0],shard[1]);
		}
		return this._client[sn];
	},
	
	_createClient: function (sn,port,ip) {
		// this should return the client
		return {};
	},
	
	isInt62: function (s) {
		var re = new RegExp("[^"+this._keystr+"]");
		if (!s || re.test(s)) return false;
		return true;
	},
	
	toInt62: function (x,z) {
		if (!x) return (z ? this.zeroFill(0,z) : "0");
		var ret = "";
		while (x > 0) {
			var p = x % this._strlen;
			ret = this._keystr.substring(p,p+1) + ret;
			x = Math.floor(x/this._strlen);
		}
		if (z) ret = this.zeroFill(ret, z);
		return ret;
	},
	
	fromInt62: function (x) {
		if (!x) return 0;
		var ret = 0;
		for (var j = x.length; j; j--) {
			var p = -1 * (j - x.length);
			ret += this._keystr.indexOf(x.substring(p,p+1)) * Math.pow(this._strlen,j-1);
		}
		return ret;
	},

	_nullfunc: function (){},

	genKey: function (ktype,cb,testSize) {
	// testSize is for test keys for different sizes
		
		var self = this,
			// milliseconds from epoch:
			m = Date.now() - this._epoch,
			n = testSize || this.size,
			pars = {
				m: m,
				n: n,
				s: m % n,
				t: ktype || 0
			},
			callback = cb || this._nullfunc;
		
//		console.log(JSON.stringify(pars));
			
		this[testSize?"_randomVariant":"addVariant"](pars,function (pars) {
			var k = self.toInt62(pars.m) 
				+ self.toInt62(pars.v,2) 
				+ self.toInt62(pars.n,2) 
				+ self.toInt62(pars.s,2)
				+ self.toInt62(pars.t,2);
			callback(k);
		});
	},
	
	addVariant: function (pars,callback) {
		// this should use sequences in the database
		this._randomVariant(pars,callback);
	},
	
	_randomVariant: function (pars,callback) {
		pars.v = (Math.random() * 100000) % this._variants;
		callback(pars);
	},
	
	fixedKey: function (ktype,shard,variant) {
		if (shard > this.size) shard = shard % this.size;
		if (variant > this._variants) variant = variant % this._variants;
		return '0' 
			+ this.toInt62(variant,2) 
			+ this.toInt62(this.size,2)
			+ this.toInt62(shard,2)
			+ this.toInt62(ktype,2);
	},
	
	_arrange: function (key) {
		var l = key.length;
		return { 
			m: this.fromInt62(key.substring(0,l-8)),
			v: this.fromInt62(key.substring(l-8,l-6)),
		    n: this.fromInt62(key.substring(l-6,l-4)),
		    s: this.fromInt62(key.substring(l-4,l-2)),
		    t: this.fromInt62(key.substring(l-2,l))
		};
	},
	
	changeKeyType: function (key,newtype) {
		return key.substring(0,key.length-2) + this.toInt62(newtype,2);
	},
	
	toDecimalString: function (key) {
		// If you try to convert it to an integer width this.fromInt62(key)
		// you will fail because it would be a 62-bit integer that is
		// not managed by Javascript
		var K = this._arrange(key);
		return K.m + this.zeroFill(K.v,4) + this.zeroFill(K.n,4) + this.zeroFill(K.s,4) +  + this.zeroFill(K.t,4);
	},
	
	getShard: function (key,newSize) {
		// This verifies the key and return the shard that hosts the the key
        var k = (key||'').toString();
        console.log(k);
		if (/[^0-9A-Za-z]/.test(k) || k.length < 9) return -1;
		
		var K = this._arrange(k),
	    	m = K.m;
	    if (m > Date.now() - this._epoch) return -1;
	    var n = K.n,
    		s = K.s,
    		// ifNodes is for moving keys from a shard to another
    		
    		N = newSize || this.size;
	    
    	// if the key was generated with a different number of nodes
	    if (N != n) { 
	    	var v = K.v % N;
	    	if (N > n && v >= n) { // shard number has increased and the key must be moved
	    		s = (K.v % (N - n)) + n;
	    	}
	    	else if (N < n && N < s) { // the shard number has been reduced
	    		s = v;
	    	}
	    }
	    if (this.shards[s] || newSize) return s;
	    return -1;
	},
		
	whereToMove: function (key,newSize) {
		return [this.whereIs(key), this.getShard(key,newSize)];
	},
	
	whereIs: function (key) {
		var s = this.getShard(key);
		if (s == -1) {
			console.log("Bad key: "+key);
			// to avoid errors return the first shard:
			return 0;
		}
		return s;
	},
	
	getClient: function (key) {
		return this._clientInit(this.whereIs(key));
	}
	
});

