//dari komoditas model
var komoditas = require('./../../models/komoditas/komoditasModel');
//dari operasi pasar model
var op = require('./../../models/masyarakat/operasiPasarModel');
var users = require('./../../models/masyarakat/masyarakatModel');
var crypto = require('crypto');
var config=require('./../../config');
var jwt = require('jsonwebtoken');
var moment=require('moment');
var tz=require('moment-timezone');
var each = require('foreach');
//untuk math
var math = require('mathjs');
//var now = require('date-now');
var date = require('date-utils');;

//modul 1 komoditas
var addKomoditas = function(req,res){
	var newKom = new komoditas(req.body);
	//push lokasi latitude dan longitude (Number)
	//newKom.lokasi.push({latitude:req.body.latitude,longitude:req.body.longitude});
	var time = moment();
	var now = moment(new Date());
	//misal 16 March 2017
	newKom.datePost =now.format("D MMM YYYY");
	newKom.save(function(err){
		if(err){
			throw err;
		}else{
			res.json({
				data:newKom,
				message:"succes"
			});
		}
	});
};

//semua komoditas
var allKomoditas = function(req,res){
	komoditas.find({},'-_id -__v',function(err,kom){
		if(err){
			throw err;
		}else{
			res.json({
				data:kom,
				message:"succes"
			});
		}
	})
};

//komoditas yang ditampilkan *hanya untuk hari ini saja
var todayKomoditas =function(req,res){
	//untuk tanggal
	var now = moment(new Date());
	var sekarang = now.format("D MMM YYYY");
	//inisialisasi array total
	var total = [];
	var counter = 0;
	komoditas.find({jenis:req.body.jenis,datePost:sekarang},'-_id -__v',{sort:{harga:1}}, function(err,komo){
		if(err){
			throw err;
		}else if(komo==""){
			res.json({message:"no data"});
		}else{
			if(counter<komo.length){
				for(var i=0;i<komo.length;i++){
					total.push(komo[i].harga);
					counter++;
					if(counter==komo.length){
						var mak = math.max(total);
						var min = math.min(total);
						//buat parsing langsung ke integer
						var mean = parseInt(math.mean(total));
						res.json({
							data:komo,
							minimum:min,
							ratarata:mean,	
							makasimum:mak,
							message:"succes"
						});
					}
				}
			}
		}
	});
};

//modul 2 untuk CRUD masyarakat

var getAllMays=function(req,res){
	users.find(function(err,allUser){
		if(err){
			res.status(500);
			res.send("Internal server error");
			res.status(200);
		}else{
			res.send(allUser);
		}
	});
};

var addMasy=function(req,res){
	var newUser=new users(req.body);
	if(req.body.name=="" || req.body.username=="" || req.body.password=="" || req.body.email==""){
		res.json({"status":"400","message":"UnClompetely"});
	}else{
		users.findOne({username:req.body.username},function(err,user){
			if(user){
				res.json({"message":"username sudah ada"});
			}else{
				newUser.password = crypto.createHash('md5').update(req.body.password, 'ut-8').digest('hex') ;
			  	newUser.save(function(err){
					if(err){
						console.log(newUser);
						res.json({"status":"404","message":"can't save"})
					}else {
						var token = jwt.sign({us_id:newUser.us_id,role:newUser.role,username:newUser.username},config.secretKey,{
							expiresIn:60*60})
						res.status(201);
					  	res.json({
							newUser,
							token:token
					  })
				  }
			  });
		  }
	  });
	}
};

var updateMasy=function(req,res){
	users.findOne({masyId:req.params.us_id},function(err,user){
		if(!user){
			res.json({"status":"404","message":"user not founded"})
		}else {
			user.name=req.body.name;
			user.username=req.body.username;
			user.password=crypto.createHash('md5').update(req.body.password, 'ut-8').digest('hex');
			user.email=req.body.email;
			user.save(function(err){
				if(err){
					res.json({"status":"404","message":"failed updateUser"});
				}else {
					res.status(500);
					res.send(user);
				}
			});
		}
	});
};

//hapus masyarakat

var deleteMasy=function(req,res){
	users.findOne({masyId:req.params.us_id},function(err,user){
		console.log(req.params.userId);
		if(!user){
			res.json({"satus":"Not Founded User"});
		}else {						
			user.remove(function(err){
				if(err){
					res.json({"status":"404","message":"can't deleteUser"});
				}else {
					res.json({"message":"success delete user"});
				}
			});
		}
	});
};

//find one masyarakat
var findMasy=function(req,res){
	users.findOne({masyId:req.params.us_id},function(err,user){
		console.log(req.params.user_id);
		console.log(req.params.userId);
		if(!user){
			res.json({"message":"can't find user"});
		}else {
			res.status(500);
			res.send(user);
		}
	});
};

//modul 2 fungsi terakhir untuk request operasi pasar
//masyarakat request operasi pasar
var addoperasiPasar =function(req,res){
	var operasi = new op(req.body);
	//push lokasi latitude dan longitude valuenya = Number
	//operasi.lokasi.push({latitude:req.body.latitude,longitude:req.body.longitude});
	//inisialisasi time saat ini
	var now = moment(new Date());
	operasi.datePost = now.format("D MMM YYYY");
	operasi.save(function(err,komo){
		if(err){
			throw err;
		}else{
			res.json({
				data:operasi,
				message:"succes"
			});
		}
	});
};

//Histori setiap user untuk operasi pasar yang telah diminta
var operasiKu = function(req,res){
	//op = operasi pasar
	op.find({us_id:req.params.us_id},function(err,myoperasi){
		if(err){
			throw err;
		}else{
			res.json({data:myoperasi});
		}
	})
};

// untuk mendapatakan semua jenis komoditasnya saja
var allJenisKomoditas = function(req,res){
	komoditas.find({},'-_id -__v',{sort:{jenis:1}},function(err,all){
		//inisialisasi parsing dan jenis dalam bentuk array
		var parsing="";
		var jenis=[];
		var counter=0;
		if(counter<all.length){
			for(var i=0;i<all.length;i++){
				if(parsing==all[i].jenis){
					parsing=all[i].jenis;
				}else{
					parsing=all[i].jenis;
					jenis.push(all[i].jenis);
				}
				counter++;
				if(counter==all.length){
					res.json({data:jenis});
				}
			};
		}
	});
};

//Masy		= Masyarakat
//Kom		= komoditas
module.exports = {
	//modul 1 komoditas
	addKom:addKomoditas,
	allKom:allKomoditas,
	todayKom:todayKomoditas,
	allJenis:allJenisKomoditas,
	//modul 2 masyarakat
	allMasy:getAllMays,
	addMasy:addMasy,
	updateMasy:updateMasy,
	deleteMasy:deleteMasy,
	findMasy:findMasy,
	//modul 2 fungsi terakhir operasi pasar
	operasiPasar:addoperasiPasar,
	operasiKu:operasiKu
}