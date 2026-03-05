// Deklarasi tipe TypeScript (type declaration) untuk package midtrans-client
// yang tidak memiliki definisi tipe bawaan. Mendefinisikan interface Snap dan CoreApi
// beserta method-method yang digunakan dalam aplikasi.
declare module "midtrans-client" {
  export class Snap {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey: string
    })

    createTransaction(parameter: any): Promise<{
      token: string
      redirect_url: string
    }>

    transaction: {
      status(orderId: string): Promise<any>
    }
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey: string
    })
  }
}
