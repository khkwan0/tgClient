import TdClient from 'tdweb_1.8.44/dist/tdweb';
import {config} from './config.js'
import './style.css'

const client = new TdClient({readOnly: false, logVerbosityLevel: 1, fastUpdating: true, jsLogVerbosityLevel: 1, useDatabase: false, mode: 'wasm', isBackground: false})
console.log(client)

async function send(request) {
  console.log('send request: ', request)
  await client.send(request)
}

client.onUpdate = async update => {
  if (update['@type'] === 'updateAuthorizationState') {
    const authState = update.authorization_state['@type']
    console.log('authState', authState)
    if (authState === 'authorizationStateWaitTdlibParameters') {
      await send({
        '@type': 'setTdlibParameters',
        'use_test_dc': false,
        'api_id': config.REACT_APP_TELEGRAM_API_ID,
        'api_hash': config.REACT_APP_TELEGRAM_API_HASH,
        'system_language_code': 'en',
        'device_model': 'desktop',
        'application_version': '1'
      })
    }
    if (authState === 'authorizationStateReady') {
      console.log('Authorization state ready')
    }
    if (authState === 'authorizationStateWaitPhoneNumber') {
      document.querySelector('#phoneInput').disabled = false
    }
    if (authState === 'authorizationStateLoggingOut') {
      await send({
        '@type': 'close'
      })
      await send({
        '@type': 'getAuthorizationState'
      })
    }
  }
}

document.querySelector('#sendCodeButton').addEventListener('click', async () => {
  const phoneNumber = document.querySelector('#phoneInput').value
  await send({
    '@type': 'setAuthenticationPhoneNumber',
    phone_number: phoneNumber
  })
})

document.querySelector('#logoutButton').addEventListener('click', async () => {
  await send({
    '@type': 'logOut'
  })
})

client.onError = (error) => {
  console.log(error)
}