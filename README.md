## Shard

A module to manage keys along a shard of until 3844 nodes inspired by this Instagram's article:
http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram

## Features

 * fixed/special keys
 * generated time sorted keys
 * re-sharding of the keys
 * keytypes
 
## Installation via npm (coming soon)
	npm install shard

This will install also the subclass for Redis.

## Usage

### require the module
    var Shard = require('shard-redis'),
    	Redis = Shard.init(shard-config);

This is a sample of shard-config file, using 4 local instances of Redis:

	exports.config = {
			
		shards: {
		    '0': ["63700", "127.0.0.1"],
		    '1': ["63701", "127.0.0.1"],
		    '2': ["63702", "127.0.0.1"],
		    '3': ["63703", "127.0.0.1"]
		},
	
		options: {
	
	// we use the $ to indicate keys with the same name along the shards
			seqname: "$equence",
			
	// Jan. 1st, 2012		
			epoch: 1325404800000,
				
			keyTypes: {
				index: 0, // multiple hash key
				sorted: 1 // sorted set key	
			},
		
			specialKeys: {
			/*	
			 *  index: [shard,variant,keytype]
			 */	
				users: [0,0,'index'], 
				usernames: [1,0,'index'],
				emails: [2,0,'index'],
				groups: [3,0,'index'],
				comments: [0,1,'index'],
				likes: [1,1,'index'],
				search: [2,1,'sorted']
			}
		}
	};
		
		
		
		
	