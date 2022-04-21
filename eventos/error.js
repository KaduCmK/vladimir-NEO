module.exports = {
    name: 'error',
    execute(error) {
        console.error(`Ocorreu um erro: ${error}`)
    }
}