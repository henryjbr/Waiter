# Waiter para Android

O aplicativo usa Cordova para empacotar os mesmos arquivos HTML, CSS e JavaScript
publicados no Vercel em um APK Android.

## Gerar pelo GitHub

Ao enviar uma alteração para a branch `main`, o workflow **Gerar APK Android** cria
automaticamente o artefato `Waiter-Android-debug`. Ele também pode ser iniciado
manualmente na aba **Actions** do repositório.

## Gerar neste computador

Instale JDK 17 e Android Studio com Android SDK 36 e Build Tools 36.0.0. Depois,
na pasta `WaiterApp`, execute:

```powershell
npm.cmd ci
npm.cmd run android:build
```

O APK de teste será criado em
`platforms/android/app/build/outputs/apk/debug/app-debug.apk`.

Antes de cada build, `npm run sync:web` copia automaticamente os arquivos atuais
da raiz do projeto para a pasta `www` usada pelo Android.
