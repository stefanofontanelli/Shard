/*!
 * Shard-Redis version 0.2
 * December 29, 2011
 * (c) Francesco Sullo, sullof@sullof.com
 * Released under MIT Licence
 *
 * Shard64 manages re-shardable databases with up to 4096 shards.
 * 
 */

var Class = require('class-js'),
	redis = require('redis'),
	Shard = require('./shard');
		
module.exports = Shard.subclass({
	
	init: function (shards, options) {
		
		this._super(shards,options);
		this.native = redis;
	},
	
	_createClient: function (sn,port,ip) {
		var rc = redis.createClient(port,ip);
		rc.on('error', function (err) {
		    console.log('Error on '+ sn + ': ' + err);
		});
		return rc;
	},
	
	addVariant: function (pars,callback) {
		var self = this,
			rc = this._clientInit(pars.s);
		rc.get(this.seqname,function (err, val) {
			if (val) rc.incr(self.seqname);
			else {
				val = 0;
				rc.set(self.seqname,1);
			}
			pars.v = val % self.size;
			callback(pars);
		});
	}
	
});

