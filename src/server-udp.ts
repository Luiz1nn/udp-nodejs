import dgram from 'dgram'
import { IClient } from 'types/client'

const socket = dgram.createSocket('udp4')

export class Server {
  PORT: number
  HOST: string
  clients: IClient[]

  constructor () {
    this.PORT = 4500
    this.HOST = 'localhost'

    this.clients = []

    this.serverStart()
    this.clientConnect()
    this.messageCatch()
    this.clientDisconnect()
    this.exceptionHandler()

    process.on('exit', () => this.exitHandler.bind(null, { cleanup: true }))
  }

  /**
   * Este método inicia um soquete com um host e uma porta especificada e observa
   * quando um soquete está sendo ativado e fornece uma mensagem de log com o endereço
   * e a porta do novo soquete.
   */
  private serverStart () {
    socket.bind(this.PORT, this.HOST)

    socket.on('listening', () => {
      const address = socket.address()
      console.log(`servidor escutando ${address.address}:${address.port}`)
    })
  }

  /**
   * Este método observa quando um cliente se conecta ao servidor e fornece uma mensagem de log
   * com o endereço e a porta do cliente
   */
  private clientConnect () {
    socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      const menssageObject = JSON.parse(data.toString())

      if (menssageObject.header.type === 'connecting') {
        console.log(`nova conexão em ${rinfo.address}:${rinfo.port}`)
        this.clients.push({
          address: rinfo.address,
          port: rinfo.port
        })
      }
    })
  }

  /**
   * Este método observa quando um cliente se desconecta do servidor
   * e fornece uma mensagem de log e remove o cliente da matriz
   */
  private clientDisconnect () {
    socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      const menssageObject = JSON.parse(data.toString())

      if (menssageObject.header.type === 'close') {
        const index = this.clients.findIndex(client => {
          return client.address === rinfo.address && client.port === rinfo.port
        })
        console.log(`desconexão de  ${this.clients[index].address}:${this.clients[index].port}`)
        this.clients.splice(index, 1)
      }
    })
  }

  /**
   * Este método observa todas as mensagens enviadas dos clientes e fornece uma mensagem de log
   * se todas as mensagens forem capturadas
   */
  private messageCatch () {
    socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      const menssageObject = JSON.parse(data.toString())

      if (menssageObject.header.type === 'Sending') {
        const tasks = []
        for (const client of this.clients) {
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
        Promise.all(tasks).then(() => console.log('todas as mensagens enviadas!')
        )
      }
    })
  }

  /**
   * Este método observa os erros dados do soquete
   */
  private exceptionHandler () {
    socket.on('error', err => {
      console.log(`server error: ${err.stack}`)
      socket.close()
    })
  }

  /**
   * Este método é acionado quando o processo de soquete é interrompido.
   * Isso desconecta todos os clientes do servidor, envia uma mensagem com o status,
   * dá uma mensagem de feedback e depois mata o processo de soquete
   */
  private exitHandler () {
    const tasks = []
    for (const client of this.clients) {
      const data = {
        header: {
          type: 'close'
        },
        body: {
          message: Buffer.from(
            'Servidor desligando!'
          ).toJSON()
        }
      }
      const message = Buffer.from(JSON.stringify(data))

      tasks.push(
        new Promise((resolve, reseject) =>
          resolve(socket.send(message, 0, message.length, client.port, client.address))
        )
      )
    }
    console.log('tudo limpo!')
    process.exit()
  }
}

module.exports = new Server()
