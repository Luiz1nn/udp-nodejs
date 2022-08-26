import * as dgram from 'dgram'
import * as Readline from 'readline'

const SERVER_HOSTNAME = 'localhost'
const SERVER_PORT = 5000
const USER_HOSTNAME = 'localhost'

const USER_PORT = 5000
let userAddress: any = ''

const socket = dgram.createSocket('udp4')

console.log('---CHAT---')
console.log('Pressione Crtl + C para finalizar...')

const readline = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

socket.bind(USER_PORT, USER_HOSTNAME)

socket.on('listening', () => {
  userAddress = socket.address()

  const data = {
    header: {
      type: 'connecting'
    }
  }

  const message = Buffer.from(JSON.stringify(data))
  socket.send(message, 0, message.length, SERVER_PORT, SERVER_HOSTNAME)
})

socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
  const messageObject = JSON.parse(data.toString())

  if (messageObject.header.type === 'sending') {
    console.log(Buffer.from(messageObject.body.message).toString())
  } else {
    console.log('unknownsage')
  }
})

socket.on('line', input => {
  const { address, port } = userAddress
  const data = {
    header: {
      type: 'sending'
    },
    body: {
      message: Buffer.from(`${address}:${port} ---> ${input}`).toJSON()
    }
  }

  const message = Buffer.from(JSON.stringify(data))
  socket.send(message, 0, message.length, SERVER_PORT, SERVER_HOSTNAME)

  console.log(`Client: ${input}`)
})

socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
  const messageObject = JSON.parse(data.toString())

  if (messageObject.header.type === 'close') {
    console.log(Buffer.from(messageObject.body.message).toString())
    process.exit()
  }
})

socket.on('error', err => {
  console.log(`Ocorreu algum erro no servidor: ${err.stack}`)
})
