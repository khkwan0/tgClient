import TdClient from 'tdweb_1.8.44/dist/tdweb';
import {config} from './config.js'
import './style.css'

let client = null


async function send(request) {
  console.log('send request: ', request)
  const res = await client.send(request)
  return res
}

  client = new TdClient({
    readOnly: false,
    logVerbosityLevel: 2,
    fastUpdating: true,
    jsLogVerbosityLevel: 3,
    useDatabase: false,
    mode: 'wasm',
    isBackground: false,
  })
  const lstr = send({
    '@type': 'setLogStream'
  })
    /*
  await send({
    '@type': 'close'
  })
    */

    client.onUpdate = async update => {
      console.log('update: ', update)
      if (update['@type'] === 'updateAuthorizationState') {
        const authState = update.authorization_state['@type']
        console.log('Authorization State Change:', authState, update)

        if (authState === 'authorizationStateWaitTdlibParameters') {
          try {
            await send({
              '@type': 'setTdlibParameters',
              'use_test_dc': true,
              'api_id': config.REACT_APP_TELEGRAM_API_ID,
              'api_hash': config.REACT_APP_TELEGRAM_API_HASH,
              'system_language_code': 'en',
              'device_model': 'desktop',
              'application_version': '1',
              'database_directory': './tdlibx',
              'files_directory': './tdlib_files'
            })
          } catch (error) {
            console.error('Error setting TDLib parameters:', error)
          }
        }
        if (authState === 'authorizationStateReady') {
          console.log('Authorization state ready')
        }
        if (authState === 'authorizationStateWaitPhoneNumber') {
          document.querySelector('#phoneInput').disabled = false
        }
        if (authState === 'authorizationStateWaitCode') {
          document.querySelector('#codeInput').disabled = false
        }
        if (authState === 'authorizationStateLoggingOut') {
          console.log('Logging out - Check if this was intended')
          /*
          try {
            await send({
              '@type': 'close'
            })
          } catch (error) {
            console.error('Error terminating session:', error)
          }
          */
          // console.log('Connection closed - Check if this was intended')
          /*
          client = new TdClient({
            readOnly: false,
            logVerbosityLevel: 1,
            fastUpdating: true,
            jsLogVerbosityLevel: 1,
            useDatabase: true,
            mode: 'wasm',
            isBackground: false
          })
          client.onUpdate = async update => {
            console.log('xxxxupdate: ', update)
            if (update['@type'] === 'updateAuthorizationState') {
              const authState = update.authorization_state['@type']
              console.log('Authorization State Change:', authState, update)
              if (authState === 'authorizationStateWaitTdlibParameters') {
                await send({
                  '@type': 'setTdlibParameters',
                  'use_test_dc': true,
                  'api_id': config.REACT_APP_TELEGRAM_API_ID,
                  'api_hash': config.REACT_APP_TELEGRAM_API_HASH,
                  'system_language_code': 'en',
                  'device_model': 'desktop',
                  'application_version': '1',
                  'database_directory': './tdlib',
                  'files_directory': './tdlib_files'
                })
              }
            }
          }
          */
        }
      }
    }
    console.log('client: ', client)


document.querySelector('#sendNumberButton').addEventListener('click', async () => {
  const phoneNumber = document.querySelector('#phoneInput').value
  await send({
    '@type': 'setAuthenticationPhoneNumber',
    phone_number: phoneNumber,
    allow_flash_call: true,
    is_current_phone_number: true,
    _: {
      '@type': 'authenticationSettings',
      allow_flash_call: true,
      is_current_phone_number: true,
    }

  })
})

document.querySelector('#logoutButton').addEventListener('click', async () => {
  await send({
    '@type': 'destroy'
  })
})

document.querySelector('#sendCodeButton').addEventListener('click', async (event) => {
  const code = document.querySelector('#codeInput').value
  await send({
    '@type': 'checkAuthenticationCode',
    code: code
  })
})

client.onError = (error) => {
  console.error('TDLib Error:', error)
}