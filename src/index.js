const electron = require('electron');
const url = require('url');
const path = require('path');
const moment = require('moment');
const axios = require('axios');

const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage } = electron;

const currentTL = 500;
const currentBitcoin = 0.00798652;

app.on('ready', () => {

	const mainWindow = new BrowserWindow({
		width: 360,
		height: 580,
		webPreferences: {
			nodeIntegration: true
		},
		resizable: false,
		show: false,
		frame: false
	});

	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'pages/main.html'),
			protocol: 'file:',
			slashes: true
		})
	);

	// Tray Start

	let trayImage = nativeImage.createFromPath(path.join(__dirname, 'b.png'));
	trayImage = trayImage.resize({ width: 16, height: 16 });

	const tray = new Tray(trayImage);

	tray.on('click', (event) => {
		if ( mainWindow.isVisible() ){
			mainWindow.hide();
		}else{
			showWindow();	
		}
	});
	
	const showWindow = () => {
		const trayPos = tray.getBounds();
		const windowPos = mainWindow.getBounds();
		const x = Math.round(trayPos.x + (trayPos.width / 2) - (windowPos.width / 2));
		const y = Math.round(trayPos.y + trayPos.height);

		mainWindow.setPosition(x, y, false);
		mainWindow.show();
		mainWindow.focus();
	}

	mainWindow.on('blur', () => {
		mainWindow.hide();
	});

	// Tray End

	ipcMain.on('getInit', (event) => {
		sendData();
	});

	setInterval(() => {
		sendData();
	}, 60 * 2 * 1000);

	const getParibu = async () => {
		return axios({ method: 'get', url: 'https://www.paribu.com/ticker' }).then((response) => {
			return response.data.BTC_TL.last;
		});
	}

	const sendData = () => {
		getParibu().then(currentBitcoinTL => {
			mainWindow.webContents.send('init', {
				currentTL, currentBitcoin, currentBitcoinTL,
				date: moment().format('DD.MM.YYYY HH:mm:ss')
			});
			tray.setTitle(digitToMoney(currentBitcoinTL) + ' ₺');
		});
	}

	setInterval(() => {
		sendNotification();
	}, 60 * 30 * 1000);

	const sendNotification = () => {
		getParibu().then(currentBitcoinTL => {

			const currentMoney = (currentBitcoinTL * currentBitcoin).toFixed(2);

			new Notification({
				title: 'Paribu Bitcoin Takip',
				subtitle: 'Bitcoin: ' + digitToMoney(currentBitcoinTL) + ' ₺',
				body: 'Cüzdan: ' + currentMoney + ' ₺',
				silent: true,
				icon: path.join(__dirname, 'bitcoin.png')
			}).show();
			
			mainWindow.webContents.send('playSound');

		});
	}

	const digitToMoney = (money) => {
		money = money.toString();
		if ( money.length === 6 ) return money.substr(0, 3) + '.' + money.substr(3, 3);
		if ( money.length === 5 ) return money.substr(0, 2) + '.' + money.substr(2, 3);
		if ( money.length === 4 ) return money.substr(0, 1) + '.' + money.substr(1, 3);
		return money;
	}

});

// require('electron-reload')(__dirname);