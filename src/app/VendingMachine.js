const { availableCoins, products } = require('../config/data')

Number.prototype.isFloat = function () {
    return (this % 1 != 0)
}

class VendingMachine {
    getProducts () {
        return products.map((product, item) => {
            return { item, product }
        })
    }
    
    getProduct (k) {
        return products[k] ? products[k] : `Product not found`
    }
    
    giveMeMyChange (change, available, returned = {}) {
        available = available.sort((a, b) => a.coin < b.coin)
        
        for (let k in available) {
            let { coin, quant, product } = available[k]
            if (coin <= change) {
                if (quant < 1) 
                    throw `Infelizmente não temos moedas para o seu troco. Retire seu dinheiro.`
                if (!returned[coin])
                    returned[coin] = 1
                else
                    returned[coin] += 1
                available[k].quant -= 1
                change = parseInt(change - coin)
                this.giveMeMyChange(change, available, returned)
                break
            }
        }
        return returned
    }
    
    buy (price, paid) {
        if (!price)
            return `O preço do produto não é válido`
        if (!paid)
            return `Você ainda não entrou com o valor`
        if (paid < price)
            return `O produto custa ${price.toFixed(2)}, você pagou apenas ${paid.toFixed(2)}, falta ${(price - paid).toFixed(2)}`
        if (price.isFloat())
            price = parseInt((price * 100).toFixed(2))
        else if (Number.isInteger(price))
            price = price * 100
        
        if (paid.isFloat)
            paid = parseInt((paid * 100).toFixed(2))
        else if (Number.isInteger(paid))
            paid = paid * 100
        
        let change = (paid - price)
        let giveMeMyChange
        try {
            giveMeMyChange = this.giveMeMyChange(change, availableCoins)
        } catch (err) {
            return err
        }
        change = (change / 100).toFixed(2)
        return { change, coins: giveMeMyChange}
    }
}

module.exports = VendingMachine

/*
 * No método giveMeMyChange optei por usar um Object para informar as moedas que serão 
 * usadas no troco ao invés de um Array. É mais rapido e mais simples para checar se 
 * já tem a moeda salva para somar mais um.
 * 
 * Usei o sort decrescente para as moedas disponiveis para garantir que no loop seja 
 * escolhido o menor número possível de moeda.
 */
