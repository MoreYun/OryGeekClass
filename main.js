const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let whiteWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        }
    });

    mainWindow.loadFile('1main-index.html');

    mainWindow.on('closed', () => {
        app.quit();
    });
}

app.whenReady().then(() => {
    createWindow();

    // 监听渲染进程发送的 'minimize-white-window' 事件
    ipcMain.on('minimize-white-window', () => {
        if (whiteWindow) {
            // 最小化 white.html 窗口
            whiteWindow.minimize();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 在主窗口关闭时退出应用
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 在需要打开 white.html 窗口的地方
function openWhiteWindow() {
    // 获取主程序所在屏幕
    const mainScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

    whiteWindow = new BrowserWindow({
        width: mainScreen.size.width, // 设置 whiteWindow 宽度为主屏幕宽度
        height: mainScreen.size.height, // 设置 whiteWindow 高度为主屏幕高度
        x: mainScreen.bounds.x, // 设置 whiteWindow 的 x 位置为主屏幕的 x 位置
        y: mainScreen.bounds.y, // 设置 whiteWindow 的 y 位置为主屏幕的 y 位置
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
        }
    });

    // 在打开 whiteWindow 时将其切换到全屏模式
    whiteWindow.setFullScreen(true);

    whiteWindow.loadFile('white.html');

    // 监听 white.html 窗口的关闭事件
    whiteWindow.on('closed', () => {
        whiteWindow = null;
    });

}
// 监听渲染进程的关闭窗口请求
ipcMain.on('close-window-request', () => {
    // 关闭 whiteWindow 窗口
    if (whiteWindow) {
        whiteWindow.close();
    }
});
// 通过调用函数打开 white.html 窗口
ipcMain.on('open-white-window', () => {
    openWhiteWindow();
});

function openExcelWindow() {
  const excelWindow = new BrowserWindow({
    width: 1280,  // 设置宽度
    height: 720, // 设置高度
    frame: true, // 显示窗口边框和菜单栏
  });

  excelWindow.loadFile('excel/index.html'); // 加载您的HTML文件
}

// 通过调用函数打开 excel/index.html 窗口
ipcMain.on('open-excel-window', () => {
    openExcelWindow();
});


Menu.setApplicationMenu(null);
