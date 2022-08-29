import dgram from 'dgram'
import Readline from 'readline'
import { IClient } from 'types/client'

const socket = dgram.createSocket('udp4')

class Client {
  SERVER_HOST: string
  SERVER_PORT: number
  USER_HOST: string
  USER_PORT: any
  userAddress: IClient
  user: any
  readline: any

  constructor () {
    this.SERVER_HOST = 'localhost'
    this.SERVER_PORT = 4500

    this.USER_HOST = 'localhost'
    this.USER_PORT

    this.userAddress = {
      address: '',
      port: 0
    }

    this.user = ''

    this.readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    this.connection()
    this.sendingMessage()
    this.disconnection()
    this.exceptionHandler()

    process.on('exit', () => this.exitHandler.bind(process.exit()))
  }

  /**
   * Este método inicia um soquete com um host e uma porta especificada e observa quando um
   * soquete como um usuário está se preparando para armazenar seu endereço.
   * Além disso, o usuário é solicitado a fornecer um apelido para usar o chat.
   */
  private connection () {
    socket.bind(this.USER_PORT, this.USER_HOST)

    socket.on('listening', () => {
      this.userAddress = socket.address()
    })

    this.readline.question('Por favor digite seu nome de usuario: ', (answer: any) => {
      this.user = answer
      const data = {
        header: {
          type: 'connecting'
        }
      }

      const message = Buffer.from(JSON.stringify(data))
      socket.send(
        message,
        0,
        message.length,
        this.SERVER_PORT,
        this.SERVER_HOST
      )
    })
  }

  /**
   * Este método observa o processo de envio do usuário, em seguida, captura a gravação da
   * mensagem e envia para todos os outros usuários
   */
  private sendingMessage () {
    socket.on('message', (data: Buffer) => {
      const messageObject = JSON.parse(data.toString())

      if (messageObject.header.type === 'Sending') {
        console.log(Buffer.from(messageObject.body.message).toString())
      } else {
        console.log('mensagem desconhecida')
      }
    })

    this.readline.on('line', (input: any) => {
      const { address, port } = this.userAddress
      const data = {
        header: {
          type: 'Sending'
        },
        body: {
          message: Buffer.from(
            `${this.user}-${address}:${port} → ${input}`
          ).toJSON()
        }
      }

      const message = Buffer.from(JSON.stringify(data))
      socket.send(
        message,
        0,
        message.length,
        this.SERVER_PORT,
        this.SERVER_HOST
      )

      console.log(`você: ${input}`)
    })
  }

  /**
   * Este método observa quando um usuário se desconecta do bate-papo e mata o processo de soquete
   */
  private disconnection () {
    socket.on('message', (data: Buffer) => {
      const messageObject = JSON.parse(data.toString())

      if (messageObject.header.type === 'close') {
        console.log(Buffer.from(messageObject.body.message).toString())
        process.exit()
      }
    })
  }

  /**
   * Este método observa os erros dados do soquete
   */
  private exceptionHandler () {
    socket.on('error', err => {
      console.log(`server error: ${err.stack}`)
    })
  }

  /**
   * Este método é acionado quando o processo de soquete é interrompido.
   * Isso para o processo de interface, dá uma mensagem de log com o usuário que foi desconectado
   */
  private exitHandler () {
    this.readline.close()

    const data = {
      header: {
        type: 'close'
      },
      body: {
        message: Buffer.from(`${this.user} saiu do bate-papo`).toJSON()
      }
    }

    const message = Buffer.from(JSON.stringify(data))
    socket.send(message, 0, message.length, this.SERVER_PORT, this.SERVER_HOST)

    console.log('all clean!')
    process.exit()
  }
}

module.exports = new Client()
