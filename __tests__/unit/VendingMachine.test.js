const VendingMachine = new (require('../../src/app/VendingMachine'))

it(`Deve retornar erro se não enviar o valor do produto`, () => {
    let buy = VendingMachine.buy()
    expect(buy).toContain(`O preço do produto não é válido`)
    
    buy = VendingMachine.buy(0)
    expect(buy).toContain(`O preço do produto não é válido`)
})

it(`Deve retornar erro se não enviar o valor pago`, () => {
    let buy = VendingMachine.buy(1)
    expect(buy).toContain(`Você ainda não entrou com o valor`)
    
    buy = VendingMachine.buy(1, 0.00)
    expect(buy).toContain(`Você ainda não entrou com o valor`)
})

it(`Deve retornar o erro de valor pago é menor que o valor do produto`, () => {
    let product = VendingMachine.getProduct(2)
    let payment = 5.00
    let change = parseFloat((payment - product.price).toFixed(2))
    
    let buy = VendingMachine.buy(product.price, payment)
    expect(buy).toMatch(/(?=.*O produto custa)(?=.*você pagou apenas)(?=.*falta)/)
})

it(`Deve retornar o valor do troco e as moedas correspondentes`, () => {
    let product = VendingMachine.getProduct(0)
    let payment = 5.00
    let change = parseFloat((payment - product.price).toFixed(2))
    
    let buy = VendingMachine.buy(product.price, payment)
    expect(buy).toMatchObject({ change })
})

it(`Deve retornar mensagem que não a máquina não possui troco`, () => {
    let product = VendingMachine.getProduct(0)
    let payment = 10.00
    let change = parseFloat((payment - product.price).toFixed(2))
    
    let buy = VendingMachine.buy(product.price, payment)
    expect(buy).toContain(`Infelizmente não temos moedas para o seu troco. Retire seu dinheiro.`)
})
