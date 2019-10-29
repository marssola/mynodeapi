const program = require('commander')
const colors = require('colors')
const VendingMachine = new (require('./app/VendingMachine'))

program.version('0.1')
program.option('-a, --all-products', 'Get all products')
program.option('-i, --product <item>', 'Get produt')
program.option('-b, --buy', 'Buy product')
program.option('-p, --pay <value>', 'Payment value')

program.parse(process.argv)

if (program.buy) {
    let { product, pay } = program
    if (!product) {
        console.log(colors.red(`Erro: Produto não informado`))
        return
    }
    let { name, price } = VendingMachine.getProduct(product)
    if (!name || !price) {
        console.log(colors.red(`Error: Produto inválido`))
        return
    }
        
    if (!pay) {
        console.log(colors.red(`Erro: Você ainda não inseriu nenhum dinheiro para o pagamento`))
        return
    }
    pay = parseFloat(pay)
    let buy = VendingMachine.buy(price, pay)
    console.log(`${name} - ${price.toFixed(2)}, pay: ${pay.toFixed(2)}`)

    if (typeof buy === 'object')
        console.log(buy)
    else if (typeof buy === 'string')
        console.log(colors.red(buy))
    return
}

if (program.allProducts) {
    console.log(VendingMachine.getProducts())
    return
}

if (program.product) {
    console.log(VendingMachine.getProduct(program.product))
    return
}
