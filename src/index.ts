import {app, BrowserWindow, shell} from 'electron';
import settings from 'electron-settings';
import debug from 'electron-debug';
import * as path from "path";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

export type WindowSettings = {
    width: number;
    height: number;
    fullscreen: boolean;
}

let mainWindow: BrowserWindow

const createWindow = async () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
    const windowSettings = await getWindowSettings()

    mainWindow = new BrowserWindow({
        width: windowSettings.width,
        height: windowSettings.height,
    })

    mainWindow.removeMenu()
    debug()

    if (windowSettings.fullscreen) {
        mainWindow.maximize()
    }

    mainWindow.loadURL('https://web.whatsapp.com/', {
        userAgent
    })

    mainWindow.on('maximize', async () => {
        await settings.set('windowSettings.fullscreen', true);
    })

    mainWindow.on('unmaximize', async () => {
        await settings.set('windowSettings.fullscreen', false);
    })

    mainWindow.on('resized', async () => {
        const size = mainWindow.getSize();
        const width = size[0];
        const height = size[1];

        await settings.set('windowSettings.width', width);
        await settings.set('windowSettings.height', height);
    })

    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https://web.whatsapp.com/')) {
            return {action: 'allow'};
        }

        shell.openExternal(url);
        return {action: 'deny'};
    })

    mainWindow.webContents.session.clearStorageData({storages: ['serviceworkers']})
};

const getWindowSettings = async (): Promise<WindowSettings> => {
    let windowSettings = await settings.get('windowSettings') as WindowSettings;

    if (!windowSettings) {
        windowSettings = {
            width: 1280,
            height: 720,
            fullscreen: false
        }

        await settings.set('windowSettings', windowSettings);
    }

    return windowSettings
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('whatsapp', process.execPath, [path.resolve(process.argv[1])])
    }
} else {
    app.setAsDefaultProtocolClient('whatsapp')
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }

        if (commandLine.length > 0) {
            const arg = commandLine.pop()

            console.log(`Arg received: '${arg}'`)

            if (arg.startsWith('whatsapp://send/')) {
                mainWindow.loadURL(arg.replace('whatsapp://', 'https://web.whatsapp.com/'))
            }
        }
    })

    app.on('ready', createWindow);
}