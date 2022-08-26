import * as dgram from 'dgram'
import { IClient } from 'types/client'
const socket = dgram.createSocket('udp4')
// const PORT = 5000
// const hostame

const clients: IClient[] = []

socket.on('listening', () => {
  const address = socket.address()
  console.log(`Servidor iniciado em ${address.address}:${address.port}`)
  console.log('Pressione Crtl + C para finalizar...')
})

socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
  const messageObject = JSON.parse(data.toString())

  if (messageObject.header.type === 'sending') {
    const tasks = []
    for (const client of clients) {
      if (client.address === rinfo.address && client.port === rinfo.port) {
        continue
      }

      tasks.push(
        new Promise((resolve, reject) => {
          try {
            resolve(socket.send(data, 0, data.length, client.port, client.address))
          } catch (error) {
            reject(0)
          }
        })
      )
    }

    Promise.all(tasks).then(() => console.log('Mensagem entregue...'))
  } else if (messageObject.header.type === 'connecting') {
    console.log(`Novo cliente conectado no endereço ${rinfo.address}:${rinfo.port}`)
    clients.push({
      address: rinfo.address,
      port: rinfo.port
    })
  }
})
