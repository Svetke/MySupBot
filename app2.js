var TelegramBot = require('node-telegram-bot-api');
var token = '381300228:AAFLnCTMaIMJatgrqg_a1Udo-IxzqOoj3hI';
var bot = new TelegramBot(token, {polling: true});
var soap = require('soap-ntlm');
var username = 'nav-svc';
var password = 'l2K76RDmmC';
var domain = 'NCDEV';
var fs = require('fs');
var hellogif = fs.createReadStream('giphy.mp4');
var builder = require('botbuilder');
var connector = new builder.ConsoleConnector().listen();
var client = null;


soap.createClient(__dirname+'/BotSupport.xml',function(err, cl) {
	if(err){
		console.log(err);
		return;	
	}
	client = cl;
	client.setSecurity(new soap.NtlmSecurity(username, password, domain));
});	

var states = {}

function Login(msg) {
	var Id = msg.chat.id;
	states[Id] = 0;
	console.log(msg);
	client.GetEmployeeByID({
		restart: true,
		channelType: 1,
		channelID: Id,
		employeeByIDXMLPort: '',
		errorText: ''},
		function(err, res){
			if(err){
				console.log(err);
				return;
			}
			if (res.return_value != 0) {
				console.log('Ошибка: ' + res.errorText);
				bot.sendSticker(Id,__dirname+'/police.png')
				bot.sendMessage(Id,"Привет! Напиши свой корпоративный e-mail.");
				
				//bot.sendSticker(Id,policepng);
				states[Id] = 1;
			}
			else { 
				bot.sendMessage(Id, `Привет, ${res.employeeByIDXMLPort.Employee[0].FirstName}! Чем могу помочь?`);
				bot.sendSticker(Id,__dirname+'/help.png')
				//bot.sendSticker(Id,helppng);
				states[Id] = 3;
				console.log(res);
			}	
		}
	);
}

function CheckEmail(msg) {
	var email=msg.text;
	var Id = msg.chat.id;
	console.log(msg);	
	client.AddEmployeeByEMail({
		channelType: 1,
		eMail: email,
		firstName: '',
		lastName: '',
		errorText: '',
		channelID: Id},
		function(err, res){
			if(err){
				console.log(err);
				return;
			}	
			if (res.return_value != 0) {
				console.log('Ошибка: ' + res.errorText);
				bot.sendMessage(Id, 'E-mail не найден :(. Проверь правильность написания.');
				bot.sendSticker(Id,stoppng);
			} else {	
				bot.sendMessage(Id, 'На твою почту пришел код подтверждения, пришли его мне!');
				states[Id] = 2;
			}
		}
	);
}

function CheckCode(msg) {
	var code=msg.text;
	var Id = msg.chat.id;
	console.log(msg);	
	client.ValidatePassCode({
		channelType: 1,
		passCode: code,
		channelID: Id,
		employeeByIDXMLPort: '',
		errorText: ''},
		function(err, res){
			if(err){
				console.log(err);
				return;
			}
			if (res.return_value != 0) {
				console.log('Ошибка: ' + res.errorText);
				bot.sendMessage(Id, 'Неверный код. Будь внимательнее!');
			} else {	
				bot.sendMessage(Id, 'Регистрация прошла успешно! Чем могу помочь?');
				bot.sendVideo(Id,hellogif);
				states[Id] = 3;
			}	
		}
	);
}

function StartDialog(msg) {
	var mestext = msg.text;
	var Id = msg.chat.id;
	console.log(msg);
	client.Chat({
		channelID: Id,
		inText: mestext,
		multiple: false,
		multipleType: 1,
		mainDirXMLPort: '',
		outText: ''},
		function(err, res){
			if(err){
				console.log(err);
				return;
			}
			console.log(res);
			if (res.multiple != true) {
				bot.sendMessage(Id,res.outText);
			} else {
				var xmlqty = res.mainDirXMLPort.MainDir.length;
				console.log(xmlqty);
				var keyboard1 = [];
				if (res.multipleType == 1) {
					for(var i = 0; i < xmlqty; i++){	
						keyboard1.push([res.mainDirXMLPort.MainDir[i].Intent]);
					}
				} else {
					if (res.multipleType == 2) {
						for(var i = 0; i < xmlqty; i++){	
							keyboard1.push([res.mainDirXMLPort.MainDir[i].Entity]);
						}
					}
				}
				var options = {
					reply_markup: JSON.stringify({
						keyboard : keyboard1,
						one_time_keyboard: true
					}),
					
				};

				bot.sendMessage(Id,res.outText,options);
			}
		}
	);
}			


bot.on('message', function(msg) {
	var Id = msg.chat.id;
	if (msg.text == "/start") {
		Login(msg);
	} else if (states[Id] == 1) {
		CheckEmail(msg);
	} else if (states[Id] == 2) {
		CheckCode(msg);
	} else if (states[Id] == 3) {
		StartDialog(msg);
	}
	
})

//setInterval(myPromise,600000);
