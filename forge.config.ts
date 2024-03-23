import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: 'icon',
    extraResource: [
      'icon.png',
      'icon.ico'
    ]
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['win32']),
    {
      name: '@electron-forge/maker-deb',
        config: {
          options: {
            icon: 'icon.png',
            categories: ['Network'],
            description: 'A wrapper for WhatsApp web',
            productDescription: 'A wrapper for WhatsApp web',
            name: 'whatsapp-electron',
            productName: 'WhatsApp',
            homepage: 'https://github.com/ynixt/whatsapp-electron',
            maintainer: 'Ynixt'
          }
      }
    }
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          }
        ],
      },
    }),
  ],
};

export default config;
