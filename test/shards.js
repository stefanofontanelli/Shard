
var Redis = require('../lib/shard-redis').init(require('../conf/shard-config').config),
	should = require('should');


function test(name, fn){
	try {
		fn();
	}
	catch (err) {
		console.log(name, err.stack);
		return;
	}
	console.log(name, " OK");
}


// 4 nodes

test('should return the shard 2 on its 4 nodes shard', function(){
	Redis.getShard("2Jcepc34040200",4).should.equal(2);
});
	  
test('should return the shard 8 moved to 16 nodes', function(){
	Redis.getShard("2Jcepc34040200",16).should.equal(8);
});
	  
test('should return the shard 16 moved to 27 nodes', function(){
	Redis.getShard("2Jcepc34040200",27).should.equal(16);
});

test('should return the shard 38 moved to 58 nodes', function(){
	Redis.getShard("2Jcepc34040200").should.equal(2);
});

test('should return the shard 200 moved to 500 nodes', function(){
	Redis.getShard("2Jcepc34040200",500).should.equal(200);
});

// 100 nodes

test('should return the shard 95 on its 100 nodes shard', function(){
	Redis.getShard("2T3dspM81a1V00",100).should.equal(95);
});

test('should return the shard 95 moved to 120 nodes', function(){
	Redis.getShard("2T3dspM81a1V00",120).should.equal(95);
});

test('should return the shard 116 moved to 300 nodes', function(){
	Redis.getShard("2T3dspM81a1V00",300).should.equal(116);
});

test('should return the shard 1516 moved to 3000 nodes', function(){
	Redis.getShard("2T3dspM81a1V00",3000).should.equal(1516);
});

test('should return the shard 6 moved to 30 nodes', function(){
	Redis.getShard("2T3dspM81a1V00",30).should.equal(6);
});


// on 100 nodes

test('should return the shard 68 on its 100 nodes shard', function(){
	Redis.getShard("2T4QmCrM1a1400",100).should.equal(68);
});

test('should return the shard 22 moved to 32 nodes', function(){
	Redis.getShard("2T4QmCrM1a1400",32).should.equal(22);
});

test('should return the shard 14 moved to 50 nodes', function(){
	Redis.getShard("2T4QmCrM1a1400",50).should.equal(14);
});

test('should return the shard 114 moved to 150 nodes', function(){
	Redis.getShard("2T4QmCrM1a1400",150).should.equal(114);
});






test('should set, get and del a string in a shard', function () {
  var cats;
  Redis.genKey(function (key) {
	  cats = key;
//	  console.log(cats);
	  var rc = Redis.getClient(cats);
	  rc.set(cats,"Wilma");
	  rc.get(cats,function (err, val){
//		  console.log("val",val);
		  val.should.equal("Wilma");
		  rc.del(cats);
		  rc.get(cats,function (err2, val2){
			  val = val2 || 1;
			  val.should.equal(1);
		  });
		  
	  });
  });
});


//test('should set and get a string in a shard without prefix', function () {
//	  var anon;
//	  Redis.genKey("", function (key) {
//		  anon = key;
//		  console.log(anon);
//		  var rc = Redis.getClient(anon);
//		  rc.set(anon,"Anonymous");
//		  rc.get(anon,function (err, val){
//			  val.should.equal("Anonymous");
//		  });
//	  });
//	});



