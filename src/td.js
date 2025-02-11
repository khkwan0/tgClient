import TdClient from 'tdweb_1.8.44/dist/tdweb';
import {config} from './config.js'
import './style.css'

const BOTFATHER = 93372553

let client = new TdClient({
  readOnly: false,
  logVerbosityLevel: 0,
  fastUpdating: true,
  jsLogVerbosityLevel: 0,
  useDatabase: false,
  mode: 'wasm',
  isBackground: false,
})

async function send(request) {
  try {
    console.log('send request: ', request)
    const res = await client.send(request)
    console.log('res: ', res)
  } catch (e) {
    console.error('Error sending request: ', e)
  }
}

function setError(text) {
  document.querySelector('#error').textContent = text
}

async function saveToken(_token, botname) {
  try {
    if (_token) {
      const res = await fetch('https://k.lillo.ai/api/telegram/newagent', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          botName: botname,
          botUsername: botname + '_bot',
          token: _token,
        })
      })
      return await res.json()                                                                                                                                                                                                                                   }
  } catch (e) {                                                                                                                                                                                                                                                 console.error(e)
    return null                                                                                                                                                                                                                                               }
}

function parseToken(msg) {
  const key1 = 'Use this token to access the HTTP API:'
  const key2 = 'Keep your token secure and store it safely'
  const index1 = msg.indexOf(key1)
  const index2 = msg.indexOf(key2)
  if (index1 < 0) {
    return -1
  } else if (index2 < 0) {
    return -1
  } else {
    const start = index1 + key1.length + 1
    const finish = index2 - 1
    return msg.substring(start, finish)
  }
}

console.log(config.REACT_APP_TELEGRAM_API_ID)
console.log(config.REACT_APP_TELEGRAM_API_HASH)

client.onUpdate = async update => {
  if (update['@type'] === 'updateAuthorizationState') {
    const authState = update.authorization_state['@type']
    console.log('Authorization State Change:', authState, update)

    if (authState === 'authorizationStateWaitTdlibParameters') {
      try {
        await send({
          '@type': 'setTdlibParameters',
          'use_test_dc': false,
          'api_id': config.REACT_APP_TELEGRAM_API_ID,
          'api_hash': config.REACT_APP_TELEGRAM_API_HASH,
          'system_language_code': 'en',
          'device_model': 'desktop',
          'application_version': '1',
        })
      } catch (error) {
        console.error('Error setting TDLib parameters:', error)
      }
    }
    if (authState === 'authorizationStateReady') {
      console.log('Authorization state ready')
      document.querySelector('#submitButton').disabled = false
      document.querySelector('#botname').disabled = false
    }
    if (authState === 'authorizationStateWaitPhoneNumber') {
      document.querySelector('#phoneInput').disabled = false
      document.querySelector('#sendNumberButton').disabled = false 
    }
    if (authState === 'authorizationStateWaitCode') {
      document.querySelector('#codeInput').disabled = false
      document.querySelector('#sendCodeButton').disabled = false
    }
    if (authState === 'authorizationStateLoggingOut') {
      console.log('Logging out - Check if this was intended')
    }
    if (authState === 'authorizationStateWaitPassword') {
      document.querySelector('#password').disabled = false
      document.querySelector('#submitPasswordButton').disabled = false
    }
  }
  if (update['@type'] === 'updateNewMessage') {
    const message = update.message
    if (message.content['@type'] === 'messageText') {
      const text = message.content.text.text
      console.log('message: ', message)
      console.log('text: ', text)
      const sender = message.sender_id.user_id
      if (sender === BOTFATHER) {
        if (text.includes('Alright, a new bot. How are we')) {
          const botname = document.querySelector('#botname').value
          if (botname) {
            send({
              '@type': 'sendMessage',
              chat_id: message.chat_id,
              input_message_content: {
                '@type': 'inputMessageText',
                text: {
                  '@type': 'formattedText',
                  text: botname
                }
              }
            })
          }
        } else if (text.includes('Good. Now')) {
          const botname = document.querySelector('#botname').value
          if (botname) {
            send({
              '@type': 'sendMessage',
              chat_id: message.chat_id,
              input_message_content: {
                '@type': 'inputMessageText',
                text: {
                  '@type': 'formattedText',
                  text: botname + '_bot'
                }
              }
            })
          }
        } else if (text.includes('Sorry, this username is already taken')) {
          setError(text)
        } else if (text.includes('Done! Congratulations')) {
          const botname = document.querySelector('#botname').value
          const _token = parseToken(text)
          if (_token !== -1) {
            const res = await saveToken(_token, botname)
            if (res.status === 200) {
              document.querySelector('#link').textContent = `https://t.me/${botname}_bot`
            } else {
              setError('Failed to save token')
            }
          } else {
            setError('Failed to parse token')
          }
        } else if (text.includes('Sorry, too many attempts')) {
          setError(text)
        }
      }
    }
  }
}
console.log('client: ', client)


async function sendToBotFather() {
  setError('')
  // 1. Search for BotFather
  const botFather = await client.send({
    '@type': 'searchPublicChat',
    username: 'BotFather'
  });

  // 2. Create private chat
  const chat = await client.send({
    '@type': 'createPrivateChat',
    user_id: botFather.id || 93372553,
    force: true
  });

  // 3. Send message
  send({
    '@type': 'sendMessage',
    chat_id: chat.id,
    input_message_content: {
      '@type': 'inputMessageText',
      text: {
        '@type': 'formattedText',
        text: '/newbot'  // Your command here
      }
    }
  });
}

document.querySelector('#sendNumberButton').addEventListener('click', () => {
  const phoneNumber = document.querySelector('#phoneInput').value
  send({
    '@type': 'setAuthenticationPhoneNumber',
    phone_number: phoneNumber,
  })
})
/*
document.querySelector('#logoutButton').addEventListener('click', () => {
  send({
    '@type': 'destroy'
  })
})
  */

document.querySelector('#sendCodeButton').addEventListener('click', () => {
  const code = document.querySelector('#codeInput').value
  console.log('code: ', code)
  send({
    '@type': 'checkAuthenticationCode',
    code: code
  })
})

document.querySelector('#submitPasswordButton').addEventListener('click', () => {
  const password = document.querySelector('#password').value
  send({
    '@type': 'checkAuthenticationPassword',
    password: password
  })
})

document.querySelector('#submitButton').addEventListener('click', () => {
  sendToBotFather()
})

client.onError = (error) => {
  console.error('TDLib Error:', error)
}
