## Shard

A module to manage keys along a shard of up to 3844 nodes inspired by this Instagram article:
http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram

## Features

 * fixed/special keys
 * generated time sorted keys
 * re-sharding of the keys
 * key types
 
## The key format

Shard uses integer in base 62 (like url shortener) since Javascript is not able to correctly manage 64-bit integers.


The key `2T4QmCrM1a1400` is made up of 5 parts: `2T4QmC` `rM` `1a` `14` `03`


`2T4QmC` is the difference between the current timestamp in milliseconds and the starting epoch (by default Jan 1st, 2012). 

`rM` is a variance on the single shard, managed with a sequence.

`1a` is the total number of the nodes.

`14` is the original shard where is the key.

`03` is the key type. This is very useful if you need to fix your database for some reason.

## Usage

### require the module

    var Shard = require('shard-redis').init(shard-config);

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
		
To generate a key:

	Shard.genKey(Shard.keyTypes["users"],function (key) {
		do_something(key);
	});		
	
If you don't explicitly declare a key type Shard assumes that you use a default 00 type.
The command

	Shard.getClient(key)
	
returns a redis client that supports all the Redis commands (https://github.com/mranney/node_redis/).
To save the key with a value:

	Shard.getClient(key).hset(key,'value');
	
To get a hashed key:

	Shard.getClient(key).hget(key,callback);
	
To know where a key is:

	Shard.whereIs(key);

To know on what shard you have to put a key after changing the number of nodes:

	Shard.getShard(key,new_shard_size);
	
To get the decimal string of a key:

	Shard.toDecimalString(key);
	
To create a fixed key (for example the special keys in the shard-config file):

	Shard.fixedKey(ktype,fixed_shard,some_variant);
	
To change the key type, for example to associate a token to a user:

	Shard.changeKeyType(user_key,Shard.keyTypes.token);
	
Be careful, this requires that you have set a special key for tokens in your shard-config file.

			
## Credits

Shard is (c) Francesco Sullo <me@sullof.com>

## License 

(The MIT License)

Copyright (c) 2012 Francesco Sullo <me@sullof.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	